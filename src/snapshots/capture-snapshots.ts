import type { Browser, BrowserContext } from "playwright";
import type { AuthAdapter } from "../auth/auth-adapter.js";
import { SnapshotFailedError } from "../errors/snapshot-failed-error.js";
import { buildExecutionPlan } from "../runs/build-execution-plan.js";
import type { PlannedRoute, PlannedRun } from "../types/execution-plan.js";
import type { RawRoute } from "../types/route.js";
import type { RawRun } from "../types/run.js";
import type {
  CapturedSnapshot,
  RunSnapshotResult,
  SnapshotFailure,
  SnapshotReport,
} from "../types/snapshot.js";
import { captureRoute } from "./capture-route.js";
import { computeSnapshotFilePath } from "./compute-snapshot-file-path.js";
import { selectStandaloneRoutes } from "./select-standalone-routes.js";

export interface CaptureSnapshotsOptions {
  /**
   * Fourni par l'appelant, jamais créé ni fermé ici (RFC-009) : ce module ne
   * possède que le cycle de vie des `BrowserContext`, pas celui du
   * `Browser`.
   */
  readonly browser: Browser;
  readonly baseUrl: string;
  /** Répertoire de sortie, déjà résolu en chemin absolu (config `output.directory`). */
  readonly outputDirectory: string;
  readonly fullPage: boolean;
  readonly routes: readonly RawRoute[];
  readonly runs: readonly RawRun[];
  /**
   * Fournie par l'appelant (RFC-007) : requise uniquement si une route
   * résolue par le plan porte un utilisateur. `undefined` si aucune route
   * de la configuration ne nécessite d'authentification.
   */
  readonly auth?: AuthAdapter | undefined;
  readonly timeoutMs?: number;
}

/**
 * Exécute les captures Playwright (RFC-009) à partir du plan d'exécution
 * typé (RFC-008) : un `BrowserContext` isolé par run, authentification
 * paresseuse par route via l'`AuthAdapter` fourni, puis les routes
 * `enableSnapshot: true` non référencées par un run (« standalone »),
 * chacune dans son propre contexte isolé.
 *
 * Fail-fast : la première capture en échec interrompt l'exécution. Le
 * rapport renvoyé décrit dans tous les cas les captures effectivement
 * réussies avant l'arrêt, ainsi que le détail de l'échec le cas échéant.
 */
export async function captureSnapshots(options: CaptureSnapshotsOptions): Promise<SnapshotReport> {
  const startedAt = Date.now();
  const plan = buildExecutionPlan(options.runs, options.routes);
  const standaloneRoutes = selectStandaloneRoutes(options.routes, options.runs);

  const runs: RunSnapshotResult[] = [];
  let failure: SnapshotFailure | undefined;

  for (const plannedRun of plan) {
    const result = await captureRun(plannedRun, options);
    runs.push({ runName: plannedRun.runName, snapshots: result.snapshots });
    failure = result.failure;

    if (failure !== undefined) {
      break;
    }
  }

  const standalone: CapturedSnapshot[] = [];

  if (failure === undefined) {
    for (const route of standaloneRoutes) {
      const filePath = computeSnapshotFilePath(options.outputDirectory, {
        kind: "standalone",
        routeId: route.id,
      });

      const outcome = await withIsolatedContext(options.browser, (context) =>
        capturePlannedRoute(context, { route, user: route.user }, filePath, undefined, options),
      );

      if (outcome.failure !== undefined) {
        failure = outcome.failure;
        break;
      }

      standalone.push(outcome.snapshot);
    }
  }

  return {
    succeeded: failure === undefined,
    durationMs: Date.now() - startedAt,
    runs,
    standalone,
    failure,
  };
}

interface RunCaptureResult {
  readonly snapshots: readonly CapturedSnapshot[];
  readonly failure: SnapshotFailure | undefined;
}

async function captureRun(
  plannedRun: PlannedRun,
  options: CaptureSnapshotsOptions,
): Promise<RunCaptureResult> {
  return withIsolatedContext(options.browser, async (context) => {
    const snapshots: CapturedSnapshot[] = [];
    let index = 0;

    for (const plannedRoute of plannedRun.routes) {
      if (!plannedRoute.route.enableSnapshot) {
        continue;
      }

      index += 1;
      const filePath = computeSnapshotFilePath(options.outputDirectory, {
        kind: "run",
        runName: plannedRun.runName,
        index,
        routeId: plannedRoute.route.id,
      });

      const outcome = await capturePlannedRoute(
        context,
        plannedRoute,
        filePath,
        plannedRun.runName,
        options,
      );

      if (outcome.failure !== undefined) {
        return { snapshots, failure: outcome.failure };
      }

      snapshots.push(outcome.snapshot);
    }

    return { snapshots, failure: undefined };
  });
}

/**
 * Unique point de création/fermeture des `BrowserContext` (RFC-009,
 * correction post-revue) : un run et une route standalone en créent chacun
 * un, isolé, en passant systématiquement par cette fonction. `context.close()`
 * s'exécute toujours dans le `finally`, y compris si `work` échoue — aucun
 * `BrowserContext` ne peut rester ouvert après un appel, quelle que soit la
 * cause de l'échec (navigation, capture, authentification, ou toute autre
 * exception).
 */
async function withIsolatedContext<T>(
  browser: Browser,
  work: (context: BrowserContext) => Promise<T>,
): Promise<T> {
  const context = await browser.newContext();

  try {
    return await work(context);
  } finally {
    await context.close();
  }
}

interface PlannedRouteCaptureOutcome {
  readonly snapshot: CapturedSnapshot;
  readonly failure: undefined;
}

interface PlannedRouteCaptureFailure {
  readonly snapshot: undefined;
  readonly failure: SnapshotFailure;
}

/** Authentifie si nécessaire, puis capture une route sur une page dédiée du contexte donné. */
async function capturePlannedRoute(
  context: BrowserContext,
  plannedRoute: Pick<PlannedRoute, "route" | "user">,
  filePath: string,
  runName: string | undefined,
  options: CaptureSnapshotsOptions,
): Promise<PlannedRouteCaptureOutcome | PlannedRouteCaptureFailure> {
  const { route, user } = plannedRoute;
  const startedAt = Date.now();

  try {
    if (user !== undefined) {
      if (options.auth === undefined) {
        throw new SnapshotFailedError(route.id, {
          cause: new Error(
            `Aucun adaptateur d'authentification fourni pour l'utilisateur : ${user}`,
          ),
        });
      }

      try {
        await options.auth.login(context, user);
      } catch (error) {
        throw new SnapshotFailedError(route.id, { cause: error });
      }
    }

    const page = await context.newPage();
    try {
      await captureRoute({
        page,
        baseUrl: options.baseUrl,
        route,
        filePath,
        fullPage: options.fullPage,
        ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      });
    } catch (error) {
      throw new SnapshotFailedError(route.id, { cause: error });
    } finally {
      await page.close();
    }

    return {
      snapshot: { routeId: route.id, filePath, durationMs: Date.now() - startedAt },
      failure: undefined,
    };
  } catch (error) {
    return {
      snapshot: undefined,
      failure: { routeId: route.id, runName, message: toFailureMessage(error) },
    };
  }
}

/** Le rapport conserve la raison concrète de l'échec (`cause`), pas le message générique de {@link SnapshotFailedError}. */
function toFailureMessage(error: unknown): string {
  if (error instanceof SnapshotFailedError) {
    return error.cause instanceof Error ? error.cause.message : String(error.cause);
  }

  return error instanceof Error ? error.message : String(error);
}

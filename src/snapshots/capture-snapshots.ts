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
   * Provided by the caller and never created or closed here (RFC-009): this
   * module owns only `BrowserContext` lifecycle, not `Browser` lifecycle.
   */
  readonly browser: Browser;
  readonly baseUrl: string;
  /** Output directory, already resolved to an absolute path (`output.directory`). */
  readonly outputDirectory: string;
  readonly outputStructure?: "flat" | "run" | "scope";
  readonly runId?: string | undefined;
  readonly fullPage: boolean;
  readonly routes: readonly RawRoute[];
  readonly runs: readonly RawRun[];
  /**
   * Provided by the caller (RFC-007): required only when a route resolved by
   * the plan has a user. `undefined` when no route in the configuration
   * requires authentication.
   */
  readonly auth?: AuthAdapter | undefined;
  readonly timeoutMs?: number;
}

/**
 * Execute Playwright captures (RFC-009) from the typed execution plan
 * (RFC-008): one isolated `BrowserContext` per run, lazy per-route
 * authentication through the provided `AuthAdapter`, then
 * `enableSnapshot: true` routes that are not referenced by a run
 * ("standalone"), each in its own isolated context.
 *
 * Fail-fast: the first failed capture interrupts execution. The returned
 * report always describes the captures that actually succeeded before the
 * stop, plus failure details when relevant.
 */
export async function captureSnapshots(options: CaptureSnapshotsOptions): Promise<SnapshotReport> {
  const startedAt = Date.now();
  const outputStructure = options.outputStructure ?? "flat";
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
        structure: outputStructure,
        kind: "standalone",
        routeId: route.id,
        scope: route.scope,
        runId: options.runId,
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
    const outputStructure = options.outputStructure ?? "flat";
    const snapshots: CapturedSnapshot[] = [];
    let index = 0;

    for (const plannedRoute of plannedRun.routes) {
      if (!plannedRoute.route.enableSnapshot) {
        continue;
      }

      index += 1;
      const filePath = computeSnapshotFilePath(options.outputDirectory, {
        structure: outputStructure,
        kind: "run",
        runName: plannedRun.runName,
        index,
        routeId: plannedRoute.route.id,
        scope: plannedRoute.route.scope,
        runId: options.runId,
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
 * Single creation/closure point for `BrowserContext` instances (RFC-009,
 * review follow-up): every run and every standalone route creates its own
 * isolated context through this function. `context.close()` always runs in
 * the `finally` block, even when `work` fails, so no `BrowserContext` can
 * remain open after a call regardless of the failure cause.
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

/** Authenticate if needed, then capture a route on a dedicated page in the given context. */
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
            `No authentication adapter was provided for user: ${user}`,
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

/** Keep the concrete failure reason (`cause`) in reports, not the generic {@link SnapshotFailedError} message. */
function toFailureMessage(error: unknown): string {
  if (error instanceof SnapshotFailedError) {
    return error.cause instanceof Error ? error.cause.message : String(error.cause);
  }

  return error instanceof Error ? error.message : String(error);
}

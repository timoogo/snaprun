import { ApplicationStartFailedError } from "../errors/application-start-failed-error.js";
import { ApplicationUnreachableError } from "../errors/application-unreachable-error.js";
import { isBaseUrlReachable } from "./is-base-url-reachable.js";
import { spawnApplication, type RunningApplication } from "./spawn-application.js";
import { stopApplication } from "./stop-application.js";

const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;

export interface EnsureApplicationAvailableOptions {
  readonly baseUrl: string;
  readonly autoStart: boolean;
  readonly startCommand: string | undefined;
  readonly workingDirectory: string;
  /** Délai maximal d'attente de disponibilité après le lancement. Défaut : 30 s. */
  readonly startupTimeoutMs?: number;
}

/**
 * Garantit que l'application est joignable avant d'exécuter `action`
 * (RFC-011) : si `baseUrl` répond déjà, réutilise ce serveur tel quel et
 * n'y touche jamais. Sinon, si `autoStart`, lance `startCommand` depuis
 * `workingDirectory`, attend sa disponibilité, exécute `action`, puis
 * arrête — dans un `finally`, donc systématiquement — uniquement le
 * processus créé par cet appel. Un serveur externe déjà en place n'est
 * jamais arrêté : `stopApplication` n'est appelée que sur le processus que
 * cette fonction a elle-même lancé.
 *
 * @throws {ApplicationUnreachableError} `baseUrl` ne répond pas et
 *   `autoStart` est désactivé, ou le délai d'attente de disponibilité est
 *   dépassé après le lancement.
 * @throws {ApplicationStartFailedError} `autoStart` est activé sans
 *   `startCommand`, ou le processus lancé quitte avant de devenir joignable.
 */
export async function ensureApplicationAvailable<T>(
  options: EnsureApplicationAvailableOptions,
  action: () => Promise<T>,
): Promise<T> {
  if (await isBaseUrlReachable(options.baseUrl)) {
    return action();
  }

  if (!options.autoStart) {
    throw new ApplicationUnreachableError(options.baseUrl);
  }

  if (options.startCommand === undefined) {
    throw new ApplicationStartFailedError("(aucune startCommand configurée)");
  }

  const app = spawnApplication(options.startCommand, options.workingDirectory);
  const uninstallSignalHandlers = installShutdownSignalHandlers(app);

  try {
    await waitUntilReady(app, options.startCommand, options.baseUrl, options.startupTimeoutMs);
    return await action();
  } finally {
    uninstallSignalHandlers();
    await stopApplication(app);
  }
}

async function waitUntilReady(
  app: RunningApplication,
  startCommand: string,
  baseUrl: string,
  startupTimeoutMs: number | undefined,
): Promise<void> {
  const deadline = Date.now() + (startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS);

  while (Date.now() < deadline) {
    if (app.hasExited()) {
      throw new ApplicationStartFailedError(startCommand, {
        cause: new Error(
          `Code de sortie ${String(app.exitCode())}${app.capturedOutput() !== "" ? ` : ${app.capturedOutput()}` : ""}`,
        ),
      });
    }

    if (await isBaseUrlReachable(baseUrl)) {
      return;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new ApplicationUnreachableError(baseUrl);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * Best-effort : si le process SnapRun reçoit SIGINT/SIGTERM pendant que
 * l'application est en cours d'exécution, l'arrêter avant de laisser le
 * signal suivre son cours normal (RFC-011 : « gérer les signaux »).
 * `once()` : après le premier déclenchement, le comportement par défaut de
 * Node reprend la main pour le second envoi du signal.
 */
function installShutdownSignalHandlers(app: RunningApplication): () => void {
  const handleSignal = (signal: NodeJS.Signals): void => {
    void stopApplication(app).finally(() => {
      process.kill(process.pid, signal);
    });
  };

  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);

  return () => {
    process.off("SIGINT", handleSignal);
    process.off("SIGTERM", handleSignal);
  };
}

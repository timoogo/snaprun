import type { RunningApplication } from "./spawn-application.js";

const GRACE_PERIOD_MS = 3_000;
const POLL_INTERVAL_MS = 20;

/**
 * Arrête une application lancée par SnapRun (RFC-011), jamais un serveur
 * externe (cette fonction n'est appelée que sur un `RunningApplication`
 * effectivement créé par {@link spawnApplication}). `SIGTERM` d'abord (arrêt
 * propre), `SIGKILL` après un court délai de grâce si le processus ne s'est
 * pas arrêté. Cible le groupe de processus (`-pid`) sur POSIX pour éviter
 * tout processus orphelin issu d'une commande shell (ex. un gestionnaire de
 * paquets démarrant lui-même le vrai serveur).
 *
 * Sur POSIX, l'attente porte sur le groupe entier (`kill(-pid, 0)`), pas
 * seulement sur la sortie du processus directement suivi : un enfant
 * indirect, membre du même groupe, peut recevoir et traiter le même signal
 * quelques millisecondes après le processus principal — attendre
 * uniquement ce dernier laisserait une fenêtre où un tel enfant est encore
 * considéré comme arrêté alors qu'il termine juste sa fermeture.
 */
export async function stopApplication(app: RunningApplication): Promise<void> {
  if (app.hasExited() || app.pid === undefined) {
    return;
  }

  const pid = app.pid;

  sendSignal(pid, "SIGTERM");
  await waitUntilStopped(app, pid, GRACE_PERIOD_MS);

  if (isRunning(app, pid)) {
    sendSignal(pid, "SIGKILL");
    await waitUntilStopped(app, pid, GRACE_PERIOD_MS);
  }
}

function isRunning(app: RunningApplication, pid: number): boolean {
  if (process.platform === "win32") {
    return !app.hasExited();
  }

  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

function waitUntilStopped(app: RunningApplication, pid: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolvePromise) => {
    const check = (): void => {
      if (!isRunning(app, pid) || Date.now() >= deadline) {
        resolvePromise();
        return;
      }

      setTimeout(check, POLL_INTERVAL_MS);
    };

    check();
  });
}

function sendSignal(pid: number, signal: NodeJS.Signals): void {
  try {
    if (process.platform === "win32") {
      process.kill(pid, signal);
    } else {
      // Groupe de processus (detached: true à la création, RFC-011).
      process.kill(-pid, signal);
    }
  } catch {
    // Déjà arrêté entre-temps : rien à faire.
  }
}

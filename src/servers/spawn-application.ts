import { spawn } from "node:child_process";

/** Application lancée par SnapRun (RFC-011), avec son état de sortie et sa sortie capturée. */
export interface RunningApplication {
  readonly pid: number | undefined;
  hasExited(): boolean;
  exitCode(): number | null;
  /** stdout + stderr concaténés, pour diagnostiquer un échec de démarrage. */
  capturedOutput(): string;
}

/**
 * Lance `startCommand` depuis `workingDirectory` (RFC-011). `detached: true`
 * sur POSIX place le processus dans son propre groupe, pour que
 * {@link stopApplication} puisse arrêter la commande et ses éventuels
 * enfants sans laisser de processus orphelin. Préfixée par le mot-clé shell
 * `exec` sur POSIX : sans lui, `sh -c "<commande>"` garde un shell
 * intermédiaire qui place fréquemment sa propre commande dans un *nouveau*
 * groupe de processus (contrôle de job), rendant ce groupe injoignable par
 * `stopApplication` (bug constaté : le shell s'arrête, pas la commande
 * qu'il a lancée) ; `exec` fait remplacer le shell par la commande elle-même
 * (un seul processus, dans le groupe créé par `detached`). stdout/stderr
 * sont capturés, jamais affichés directement (évite le bruit tant que
 * l'application démarre normalement).
 */
export function spawnApplication(
  startCommand: string,
  workingDirectory: string,
): RunningApplication {
  const command = process.platform === "win32" ? startCommand : `exec ${startCommand}`;

  const child = spawn(command, {
    cwd: workingDirectory,
    shell: true,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  let exited = false;
  let code: number | null = null;
  let output = "";

  child.stdout?.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.on("exit", (exitCode) => {
    exited = true;
    code = exitCode;
  });
  child.on("error", () => {
    exited = true;
  });

  return {
    pid: child.pid,
    hasExited: () => exited,
    exitCode: () => code,
    capturedOutput: () => output,
  };
}

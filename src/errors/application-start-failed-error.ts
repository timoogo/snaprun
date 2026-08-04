import { SnapRunError } from "./snaprun-error.js";

/** `startCommand` absent, ou le processus lancé par SnapRun quitte avant d'être joignable (RFC-011). */
export class ApplicationStartFailedError extends SnapRunError {
  readonly code = "APPLICATION_START_FAILED";

  constructor(startCommand: string, options?: { readonly cause?: unknown }) {
    super(`Échec du démarrage de l'application via la commande : ${startCommand}`, options);
  }
}

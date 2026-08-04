import { SnapRunError } from "../errors/snaprun-error.js";

/**
 * Affiche une erreur applicative (RFC-010) : le message seul par défaut, ou
 * la pile d'appels complète et la cause d'origine avec `--debug`.
 */
export function printCliError(error: SnapRunError, debug: boolean): void {
  console.error(error.message);

  if (debug) {
    console.error(error.stack);

    if (error.cause !== undefined) {
      console.error("Cause :", error.cause);
    }
  }
}

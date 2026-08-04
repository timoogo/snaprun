import { SnapRunError } from "./snaprun-error.js";

/** `baseUrl` injoignable : ni serveur déjà démarré, ni autoStart possible, ou délai d'attente dépassé (RFC-011). */
export class ApplicationUnreachableError extends SnapRunError {
  readonly code = "APPLICATION_UNREACHABLE";

  constructor(baseUrl: string) {
    super(`Application injoignable : ${baseUrl}`);
  }
}

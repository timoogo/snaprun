import { SnapRunError } from "./snaprun-error.js";

/** `project.baseUrl` requis pour capturer, absent de la configuration (RFC-010). */
export class BaseUrlMissingError extends SnapRunError {
  readonly code = "BASE_URL_MISSING";

  constructor() {
    super(
      "project.baseUrl est requis pour capturer des snapshots : renseignez-le dans le fichier de configuration.",
    );
  }
}

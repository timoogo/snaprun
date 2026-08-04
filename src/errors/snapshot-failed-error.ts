import { SnapRunError } from "./snaprun-error.js";

/** Échec de capture d'une route (RFC-009) : navigation, authentification préalable ou écriture PNG. */
export class SnapshotFailedError extends SnapRunError {
  readonly code = "SNAPSHOT_FAILED";
  readonly routeId: string;

  constructor(routeId: string, options?: { readonly cause?: unknown }) {
    super(`Capture échouée pour la route : ${routeId}`, options);
    this.routeId = routeId;
  }
}

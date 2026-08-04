import { CliOptionConflictError } from "../errors/cli-option-conflict-error.js";
import type { SnapshotSelection } from "../types/snapshot-selection.js";

export interface SnapshotCliOptions {
  readonly runName?: string | undefined;
  readonly partial?: boolean | undefined;
  readonly route?: string | undefined;
  readonly user?: string | undefined;
}

/**
 * Traduit les options CLI de la commande par défaut (RFC-010) en une
 * {@link SnapshotSelection} typée. Valide les combinaisons interdites
 * explicitement, avant tout accès à la configuration ou au navigateur.
 *
 * @throws {CliOptionConflictError} Combinaison d'options incompatibles.
 */
export function resolveSnapshotSelection(options: SnapshotCliOptions): SnapshotSelection {
  const { runName, partial, route, user } = options;

  if (partial === true && runName === undefined) {
    throw new CliOptionConflictError("--partial nécessite --runName.");
  }

  if (user !== undefined && route === undefined) {
    throw new CliOptionConflictError("--user nécessite --route.");
  }

  if (user !== undefined && runName !== undefined) {
    throw new CliOptionConflictError(
      "--user ne peut pas être combiné à --runName : configurez le user du run dans la configuration.",
    );
  }

  if (runName !== undefined && route !== undefined) {
    return { kind: "run-route", runName, routePath: route };
  }

  if (runName !== undefined) {
    return { kind: "run", runName };
  }

  if (route !== undefined) {
    return { kind: "route", routePath: route, user };
  }

  return { kind: "all" };
}

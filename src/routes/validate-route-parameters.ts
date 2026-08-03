import { DynamicParameterMissingError } from "../errors/dynamic-parameter-missing-error.js";
import { DynamicParameterUnknownError } from "../errors/dynamic-parameter-unknown-error.js";
import type { RawDynamicRoute } from "../types/route.js";
import { computeParameterDiscrepancies } from "../domain/routes/compute-parameter-discrepancies.js";

/**
 * Valide la cohérence structurelle entre `path` et `parameters` d'une route
 * dynamique. Appelée systématiquement (RFC-004, correction post-revue),
 * indépendamment de la présence de `snapshotPath` : celui-ci ne remplace que
 * l'URL finale visitée, il ne dispense jamais de cette validation.
 *
 * @throws {DynamicParameterMissingError} Segment `[param]` sans valeur dans `parameters`.
 * @throws {DynamicParameterUnknownError} Clé de `parameters` non référencée dans `path`.
 */
export function validateRouteParameters(route: RawDynamicRoute): void {
  const { missing, unknown } = computeParameterDiscrepancies(route.path, route.parameters);

  const firstMissing = missing[0];
  if (firstMissing !== undefined) {
    throw new DynamicParameterMissingError(route.id, firstMissing);
  }

  const firstUnknown = unknown[0];
  if (firstUnknown !== undefined) {
    throw new DynamicParameterUnknownError(route.id, firstUnknown);
  }
}

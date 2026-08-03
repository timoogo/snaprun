import { DynamicParameterMissingError } from "../errors/dynamic-parameter-missing-error.js";
import type { RawDynamicRoute, RawRoute } from "../types/route.js";
import { validateRouteParameters } from "./validate-route-parameters.js";

const PARAMETER_PATTERN = /\[([A-Za-z_][A-Za-z0-9_]*)\]/g;

/**
 * Résout le chemin final d'une route.
 *
 * La cohérence entre `path` et `parameters` d'une route dynamique est
 * toujours vérifiée (RFC-004, correction post-revue), même quand
 * `snapshotPath` est fourni : celui-ci ne remplace que l'URL finale
 * visitée, il ne dispense jamais de la validation du modèle.
 *
 * Priorité de résolution : `snapshotPath` s'il est fourni, sinon
 * substitution des segments `[param]` de `path` par les valeurs de
 * `parameters` (encodées pour l'URL).
 *
 * @throws {DynamicParameterMissingError} Segment `[param]` sans valeur dans `parameters`.
 * @throws {DynamicParameterUnknownError} Clé de `parameters` non référencée dans `path`.
 */
export function resolveRoutePath(route: RawRoute): string {
  if (!route.isDynamic) {
    return route.snapshotPath ?? route.path;
  }

  // Appelée même quand `snapshotPath` est fourni : voir la note ci-dessus.
  validateRouteParameters(route);

  return route.snapshotPath ?? substituteDynamicPath(route);
}

/**
 * Suppose une route déjà validée par {@link validateRouteParameters} (appelée
 * juste avant dans {@link resolveRoutePath}). Le contrôle de présence
 * ci-dessous reste une défense en profondeur si cette fonction venait à être
 * appelée directement sur une donnée non validée.
 */
function substituteDynamicPath(route: RawDynamicRoute): string {
  return route.path.replace(PARAMETER_PATTERN, (_match, parameterName: string) => {
    const value = route.parameters[parameterName];
    if (value === undefined) {
      throw new DynamicParameterMissingError(route.id, parameterName);
    }

    return encodeURIComponent(value);
  });
}

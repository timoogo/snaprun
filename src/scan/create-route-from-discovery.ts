import { extractPathParameterNames } from "../domain/routes/extract-path-parameter-names.js";
import type { DiscoveredRoute } from "../types/discovered-route.js";
import type { RawRoute } from "../types/route.js";
import { generateRouteId } from "./generate-route-id.js";
import { PLACEHOLDER_PARAMETER_VALUE } from "./placeholder-parameter-value.js";

/**
 * Construit l'entrée `Route` à ajouter à la configuration pour une route
 * découverte (appelée uniquement pour des routes sans segment catch-all,
 * filtrées en amont par `mergeDiscoveredRoutes` — voir `hasCatchAllSegment`).
 *
 * `enableSnapshot` (option `--default`) ne s'applique qu'aux routes
 * statiques. Une route dynamique reçoit toujours des valeurs de paramètres
 * placeholder ({@link PLACEHOLDER_PARAMETER_VALUE}) : sa valeur réelle
 * n'est jamais connue au moment du scan, elle est donc **toujours** créée
 * avec `enableSnapshot: false`, y compris avec `--default=enabled`, pour ne
 * jamais capturer automatiquement une URL volontairement incorrecte
 * (correction post-revue, RFC-006).
 */
export function createRouteFromDiscovery(
  discovered: DiscoveredRoute,
  usedIds: ReadonlySet<string>,
  defaultEnableSnapshot: boolean,
): RawRoute {
  const id = generateRouteId(discovered.path, usedIds);

  if (!discovered.isDynamic) {
    return { id, path: discovered.path, enableSnapshot: defaultEnableSnapshot };
  }

  const parameterNames = extractPathParameterNames(discovered.path);
  const parameters = Object.fromEntries(
    parameterNames.map((name) => [name, PLACEHOLDER_PARAMETER_VALUE]),
  );

  return {
    id,
    path: discovered.path,
    isDynamic: true,
    parameters,
    enableSnapshot: false,
  };
}

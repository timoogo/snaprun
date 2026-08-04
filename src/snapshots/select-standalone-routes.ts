import type { RawRoute } from "../types/route.js";
import type { RawRun } from "../types/run.js";

/**
 * Routes capturées hors run (RFC-009) : `enableSnapshot: true` et jamais
 * référencées par `run.routes` d'un run. Ordre préservé de `routes` (aucun
 * ordre de run ne s'applique à ces captures indépendantes).
 */
export function selectStandaloneRoutes(
  routes: readonly RawRoute[],
  runs: readonly RawRun[],
): readonly RawRoute[] {
  const referencedRouteIds = new Set(runs.flatMap((run) => run.routes));

  return routes.filter((route) => route.enableSnapshot && !referencedRouteIds.has(route.id));
}

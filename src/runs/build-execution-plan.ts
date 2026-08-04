import { UserConflictError } from "../errors/user-conflict-error.js";
import { findRouteById } from "../routes/find-route-by-id.js";
import type { ExecutionPlan, PlannedRoute, PlannedRouteSnapshot } from "../types/execution-plan.js";
import type { RawRoute } from "../types/route.js";
import type { RawRun } from "../types/run.js";

/**
 * Construit le plan d'exécution typé (RFC-008), avant toute ouverture de
 * navigateur : runs triés par `order` (égalité → ordre du tableau `runs`,
 * `Array.prototype.sort` étant stable), routes résolues dans l'ordre exact de
 * `run.routes`, utilisateur effectif calculé par run/route.
 *
 * @throws {RouteNotFoundError} Un `run.routes` référence un identifiant absent de `routes`.
 * @throws {UserConflictError} `run.user` et `route.user` sont tous deux définis et diffèrent.
 */
export function buildExecutionPlan(
  runs: readonly RawRun[],
  routes: readonly RawRoute[],
): ExecutionPlan {
  return [...runs]
    .sort((a, b) => a.order - b.order)
    .map((run) => ({
      runName: run.runName,
      order: run.order,
      routes: run.routes.map((routeId) => resolvePlannedRoute(run, routeId, routes)),
    }));
}

function resolvePlannedRoute(
  run: RawRun,
  routeId: string,
  routes: readonly RawRoute[],
): PlannedRoute {
  const route = findRouteById(routes, routeId);

  if (run.user !== undefined && route.user !== undefined && run.user !== route.user) {
    throw new UserConflictError(run.runName, route.id, run.user, route.user);
  }

  return { route: snapshotRoute(route), user: route.user ?? run.user };
}

/**
 * Copie indépendante de `route` : ni la route elle-même ni son
 * `parameters` (route dynamique) ne sont partagés avec `config.routes`, afin
 * qu'une mutation ultérieure de la configuration chargée ne se répercute
 * jamais sur un plan déjà construit.
 */
function snapshotRoute(route: RawRoute): PlannedRouteSnapshot {
  if (route.isDynamic === true) {
    return { ...route, parameters: { ...route.parameters } };
  }

  return { ...route };
}

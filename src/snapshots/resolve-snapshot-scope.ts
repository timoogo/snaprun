import { RouteNotFoundError } from "../errors/route-not-found-error.js";
import { findRouteById } from "../routes/find-route-by-id.js";
import { findRouteByPath } from "../routes/find-route-by-path.js";
import { findRunByName } from "../runs/find-run-by-name.js";
import type { RawRoute } from "../types/route.js";
import type { RawRun } from "../types/run.js";
import type { SnapshotSelection } from "../types/snapshot-selection.js";

export interface SnapshotScope {
  readonly routes: readonly RawRoute[];
  readonly runs: readonly RawRun[];
}

/**
 * Réduit `routes`/`runs` à la portée demandée par la {@link SnapshotSelection}
 * (RFC-010), avant de les transmettre à `captureSnapshots` (RFC-009). Pour
 * `run`, `routes` est limité aux routes référencées par ce run, afin
 * qu'aucune autre route ne soit capturée comme « standalone » par erreur
 * (RFC-009 traite comme standalone toute route activée non référencée par un
 * run du sous-ensemble transmis).
 *
 * @throws {RunNotFoundError} `--runName` ne correspond à aucun run.
 * @throws {RouteNotFoundError} `--route` ne correspond à aucune route, ou ne
 *   fait pas partie du run sélectionné (`run-route`).
 */
export function resolveSnapshotScope(
  routes: readonly RawRoute[],
  runs: readonly RawRun[],
  selection: SnapshotSelection,
): SnapshotScope {
  switch (selection.kind) {
    case "all":
      return { routes, runs };

    case "run": {
      const run = findRunByName(runs, selection.runName);
      const referencedRoutes = run.routes.map((routeId) => findRouteById(routes, routeId));
      return { routes: referencedRoutes, runs: [run] };
    }

    case "route": {
      const route = findRouteByPath(routes, selection.routePath);
      // Sélection CLI explicite : prime sur enableSnapshot (RFC-010) et sur
      // le user configuré si --user est fourni.
      return {
        routes: [{ ...route, enableSnapshot: true, user: selection.user ?? route.user }],
        runs: [],
      };
    }

    case "run-route": {
      const run = findRunByName(runs, selection.runName);
      const route = findRouteByPath(routes, selection.routePath);

      if (!run.routes.includes(route.id)) {
        throw new RouteNotFoundError(route.id);
      }

      return { routes: [route], runs: [{ ...run, routes: [route.id] }] };
    }
  }
}

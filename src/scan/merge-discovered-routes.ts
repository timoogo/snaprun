import { hasCatchAllSegment } from "../scanners/parse-route-segment.js";
import type { DiscoveredRoute } from "../types/discovered-route.js";
import type { RawRoute } from "../types/route.js";
import { createRouteFromDiscovery } from "./create-route-from-discovery.js";

export interface MergeDiscoveredRoutesResult {
  readonly added: readonly RawRoute[];
  readonly unchanged: readonly RawRoute[];
  /** Routes existantes non retrouvées par le scan : signalées, jamais retirées d'elles-mêmes. */
  readonly obsolete: readonly RawRoute[];
  /**
   * Routes catch-all (`[...slug]`) ou catch-all optionnelles (`[[...slug]]`)
   * découvertes sans correspondance existante : jamais ajoutées
   * automatiquement à `routes` (RFC-004/005 ne savent pas construire leur
   * URL concrète), seulement signalées comme non prises en charge.
   */
  readonly unsupportedCatchAll: readonly DiscoveredRoute[];
  /** `existingRoutes` inchangé dans son ordre, `added` toujours ajouté à la fin (RFC-006). */
  readonly mergedRoutes: readonly RawRoute[];
}

/**
 * Fusionne les routes découvertes avec les routes existantes de la
 * configuration (RFC-006). Correspondance par `path` :
 * - une route existante retrouvée reste inchangée (id, enableSnapshot, user,
 *   parameters, snapshotPath, ordre) — y compris une route catch-all déjà
 *   configurée manuellement par l'utilisateur ;
 * - une route découverte sans correspondance existante est ajoutée, sauf si
 *   elle contient un segment catch-all (voir `unsupportedCatchAll`) ;
 * - une route existante non retrouvée est signalée « obsolète », jamais
 *   supprimée automatiquement.
 */
export function mergeDiscoveredRoutes(
  existingRoutes: readonly RawRoute[],
  discoveredRoutes: readonly DiscoveredRoute[],
  defaultEnableSnapshot: boolean,
): MergeDiscoveredRoutesResult {
  const existingByPath = new Map(existingRoutes.map((route) => [route.path, route]));
  const discoveredPaths = new Set(discoveredRoutes.map((route) => route.path));
  const usedIds = new Set(existingRoutes.map((route) => route.id));

  const added: RawRoute[] = [];
  const unchanged: RawRoute[] = [];
  const unsupportedCatchAll: DiscoveredRoute[] = [];

  for (const discovered of discoveredRoutes) {
    const existing = existingByPath.get(discovered.path);

    if (existing !== undefined) {
      unchanged.push(existing);
      continue;
    }

    if (hasCatchAllSegment(discovered.path)) {
      unsupportedCatchAll.push(discovered);
      continue;
    }

    const newRoute = createRouteFromDiscovery(discovered, usedIds, defaultEnableSnapshot);
    usedIds.add(newRoute.id);
    added.push(newRoute);
  }

  const obsolete = existingRoutes.filter((route) => !discoveredPaths.has(route.path));

  return {
    added,
    unchanged,
    obsolete,
    unsupportedCatchAll,
    mergedRoutes: [...existingRoutes, ...added],
  };
}

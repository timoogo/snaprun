import type { DiscoveredRoute } from "../types/discovered-route.js";

/**
 * Déduplique par chemin final (l'App Router l'emporte sur le Pages Router en
 * cas de collision, comme Next.js lui-même) et trie de façon déterministe
 * (RFC-005 : sortie stable).
 */
export function normalizeDiscoveredRoutes(routes: readonly DiscoveredRoute[]): DiscoveredRoute[] {
  const byPath = new Map<string, DiscoveredRoute>();

  for (const route of routes) {
    const existing = byPath.get(route.path);

    if (existing === undefined || (existing.router === "pages" && route.router === "app")) {
      byPath.set(route.path, route);
    }
  }

  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

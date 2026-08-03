import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import type { DiscoveredRoute } from "../types/discovered-route.js";
import {
  isDynamicSegment,
  isInterceptingRouteSegment,
  isRouteGroupSegment,
} from "./parse-route-segment.js";

const RECOGNIZED_EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);
const PAGE_BASENAME = "page";
const EXCLUDED_BASENAMES = new Set([
  "layout",
  "loading",
  "error",
  "template",
  "default",
  "route",
  "not-found",
  "global-error",
]);

/** Découvre les pages d'un répertoire App Router (`app/` ou `src/app/`). */
export async function discoverAppRoutes(appDir: string): Promise<DiscoveredRoute[]> {
  const routes: DiscoveredRoute[] = [];
  await walk(appDir, []);
  return routes;

  async function walk(currentDir: string, urlSegments: readonly string[]): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Dossiers privés (_), slots parallèles (@) et routes interceptantes
        // ((.), (..), (..)(..), (...)) : jamais parcourus. Pour les routes
        // interceptantes, leur URL canonique dépend du nombre de niveaux
        // remontés par rapport à la position du dossier — non résolu en V1
        // (RFC-005) ; les exclure entièrement du scan est le seul moyen sûr
        // d'éviter de produire un segment d'URL inexistant comme
        // `(.)photo` ou `(..)modal`.
        if (
          entry.name.startsWith("_") ||
          entry.name.startsWith("@") ||
          isInterceptingRouteSegment(entry.name)
        ) {
          continue;
        }

        const nextSegments = isRouteGroupSegment(entry.name)
          ? urlSegments
          : [...urlSegments, entry.name];

        await walk(join(currentDir, entry.name), nextSegments);
        continue;
      }

      const extension = extname(entry.name);
      const basename = entry.name.slice(0, entry.name.length - extension.length);

      if (!RECOGNIZED_EXTENSIONS.has(extension) || EXCLUDED_BASENAMES.has(basename)) {
        continue;
      }

      if (basename !== PAGE_BASENAME) {
        continue;
      }

      routes.push({
        path: `/${urlSegments.join("/")}`,
        filePath: join(currentDir, entry.name),
        router: "app",
        isDynamic: urlSegments.some(isDynamicSegment),
      });
    }
  }
}

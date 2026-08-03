import type { DiscoveredRoute } from "../types/discovered-route.js";
import { discoverAppRoutes } from "./discover-app-routes.js";
import { discoverPagesRoutes } from "./discover-pages-routes.js";
import { findRouterDirectory } from "./find-router-directory.js";
import { normalizeDiscoveredRoutes } from "./normalize-discovered-routes.js";
import type { RouteScanner } from "./scanner.js";

const APP_DIRECTORY_CANDIDATES = ["app", "src/app"];
const PAGES_DIRECTORY_CANDIDATES = ["pages", "src/pages"];

/**
 * Moteur de scan natif (RFC-005) : détecte App Router et Pages Router en
 * s'appuyant sur les conventions de répertoires officielles de Next.js, sans
 * dépendance externe. Les deux routers sont scannés s'ils coexistent
 * (migration incrémentale).
 */
export class FilesystemRouteScanner implements RouteScanner {
  async scan(projectRoot: string): Promise<DiscoveredRoute[]> {
    const appDir = await findRouterDirectory(projectRoot, APP_DIRECTORY_CANDIDATES);
    const pagesDir = await findRouterDirectory(projectRoot, PAGES_DIRECTORY_CANDIDATES);

    const appRoutes = appDir !== undefined ? await discoverAppRoutes(appDir) : [];
    const pagesRoutes = pagesDir !== undefined ? await discoverPagesRoutes(pagesDir) : [];

    return normalizeDiscoveredRoutes([...appRoutes, ...pagesRoutes]);
  }
}

import type { DiscoveredRoute } from "../types/discovered-route.js";
import { FilesystemRouteScanner } from "./filesystem-route-scanner.js";
import type { RouteScanner } from "./scanner.js";

/**
 * Façade stable utilisée par le reste de SnapRun (RFC-005). Délègue à un
 * moteur interne — `FilesystemRouteScanner` aujourd'hui. Remplacer le moteur
 * (ex. un futur `NextListRouteScanner` ou `NextManifestRouteScanner`) se fait
 * ici, sans changer les appelants de `NextjsRouteScanner`.
 */
export class NextjsRouteScanner implements RouteScanner {
  private readonly engine: RouteScanner;

  constructor(engine: RouteScanner = new FilesystemRouteScanner()) {
    this.engine = engine;
  }

  async scan(projectRoot: string): Promise<DiscoveredRoute[]> {
    return this.engine.scan(projectRoot);
  }
}

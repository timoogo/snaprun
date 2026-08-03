import type { DiscoveredRoute } from "../types/discovered-route.js";

/**
 * Contrat minimal d'un moteur de découverte de routes (RFC-005). Volontairement
 * léger, sans architecture multi-framework : un seul moteur Next.js à la fois.
 */
export interface RouteScanner {
  scan(projectRoot: string): Promise<DiscoveredRoute[]>;
}

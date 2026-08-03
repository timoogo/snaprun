import type { DiscoveredRoute } from "./discovered-route.js";
import type { RawRoute } from "./route.js";

/** Résultat d'une fusion `snaprun scan` (RFC-006). */
export interface ScanResult {
  readonly configFilePath: string;
  readonly added: readonly RawRoute[];
  readonly unchanged: readonly RawRoute[];
  /** Routes présentes en configuration mais non retrouvées par le scan : signalées, jamais supprimées. */
  readonly obsolete: readonly RawRoute[];
  /** Routes catch-all découvertes, jamais ajoutées automatiquement : non prises en charge. */
  readonly unsupportedCatchAll: readonly DiscoveredRoute[];
  readonly fileModified: boolean;
}

import { ConfigInvalidError } from "../errors/config-invalid-error.js";
import type { RawRoute } from "../types/route.js";

/**
 * Remplace uniquement la clé `routes` d'un objet de configuration brut
 * (non validé/défaulté), en conservant toutes les autres sections telles
 * qu'elles ont été lues sur disque (RFC-006 : modification limitée à `routes`).
 */
export function replaceRoutesInRawConfig(
  rawConfig: unknown,
  routes: readonly RawRoute[],
): Record<string, unknown> {
  if (typeof rawConfig !== "object" || rawConfig === null || Array.isArray(rawConfig)) {
    throw new ConfigInvalidError("La configuration n'est pas un objet JSON valide.");
  }

  return { ...(rawConfig as Record<string, unknown>), routes };
}

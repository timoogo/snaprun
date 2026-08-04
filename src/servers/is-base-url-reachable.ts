const DEFAULT_CHECK_TIMEOUT_MS = 2_000;

/**
 * Teste si `baseUrl` répond (RFC-011) : toute réponse HTTP reçue, quel que
 * soit son code de statut, signifie qu'un serveur est déjà là et doit être
 * réutilisé tel quel. Seule une absence de réponse (connexion refusée, hôte
 * injoignable, délai dépassé) est traitée comme « non joignable ».
 */
export async function isBaseUrlReachable(
  baseUrl: string,
  timeoutMs: number = DEFAULT_CHECK_TIMEOUT_MS,
): Promise<boolean> {
  try {
    await fetch(baseUrl, { method: "GET", signal: AbortSignal.timeout(timeoutMs) });
    return true;
  } catch {
    return false;
  }
}

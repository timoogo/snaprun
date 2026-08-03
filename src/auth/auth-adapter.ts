import type { BrowserContext } from "playwright";

/**
 * Abstraction légère d'authentification (RFC-007), volontairement minimale :
 * une seule méthode, indépendante de tout fournisseur (Better Auth,
 * NextAuth, formulaire maison...).
 *
 * `context` est fourni par l'appelant (un run, RFC-008) : cet adaptateur ne
 * crée ni ne gère de contexte navigateur lui-même.
 */
export interface AuthAdapter {
  /**
   * Authentifie `userId` sur `context`. Si `context` porte déjà une session
   * valide pour cet utilisateur (connexion déjà effectuée dans ce run), ne
   * refait aucune action réseau.
   *
   * @throws {UserNotFoundError} `userId` absent de la configuration.
   * @throws {AuthenticationFailedError} La stratégie de succès configurée n'est jamais atteinte.
   */
  login(context: BrowserContext, userId: string): Promise<void>;
}

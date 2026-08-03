import type { BrowserContext, Page } from "playwright";
import { AuthenticationFailedError } from "../errors/authentication-failed-error.js";
import { UserNotFoundError } from "../errors/user-not-found-error.js";
import { resolveEnvValue } from "../env/resolve-env-value.js";
import type { AuthConfig } from "../types/auth.js";
import type { AuthAdapter } from "./auth-adapter.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export interface FormAuthAdapterOptions {
  readonly auth: AuthConfig;
  readonly baseUrl: string;
  /** Répertoire depuis lequel les `${VARIABLE}` de `auth.users` sont résolues (RFC-003). */
  readonly workingDirectory: string;
  /** Délai maximal d'attente de la stratégie de succès. Défaut : 10 s. */
  readonly timeoutMs?: number;
}

/**
 * Authentification générique par formulaire HTML (RFC-007), indépendante de
 * tout fournisseur (Better Auth, NextAuth...). Remplit `selectors.email` /
 * `selectors.password`, clique `selectors.submit`, puis attend `successUrl`
 * et/ou `successSelector` (succès dès que l'un des deux critères configurés
 * est atteint en premier).
 */
export class FormAuthAdapter implements AuthAdapter {
  /**
   * L'état de session est porté par le `BrowserContext` (ses cookies), pas
   * par cette instance d'adaptateur : la mémorisation « déjà authentifié »
   * doit donc être rattachée à chaque contexte, pas globale à l'adaptateur
   * (correction post-revue, RFC-007). `WeakMap` : aucune référence forte qui
   * empêcherait la libération d'un contexte fermé.
   */
  private readonly authenticatedUserIdsByContext = new WeakMap<BrowserContext, Set<string>>();

  constructor(private readonly options: FormAuthAdapterOptions) {}

  async login(context: BrowserContext, userId: string): Promise<void> {
    if (this.authenticatedUserIdsByContext.get(context)?.has(userId) === true) {
      // Déjà authentifié dans ce contexte : la session est portée par ses
      // cookies, aucune nouvelle action réseau n'est nécessaire. Éviter de
      // re-soumettre le formulaire ici est nécessaire, pas seulement une
      // optimisation : une application déjà authentifiée redirige
      // généralement loin de la page de login, où les sélecteurs du
      // formulaire n'existent plus.
      return;
    }

    const credentials = this.options.auth.users[userId];
    if (credentials === undefined) {
      throw new UserNotFoundError(userId);
    }

    const email = resolveEnvValue(credentials.email, {
      workingDirectory: this.options.workingDirectory,
    });
    const password = resolveEnvValue(credentials.password, {
      workingDirectory: this.options.workingDirectory,
    });

    const page = await context.newPage();

    try {
      const { selectors, loginRoute } = this.options.auth;

      await page.goto(new URL(loginRoute, this.options.baseUrl).toString());
      await page.fill(selectors.email, email);
      await page.fill(selectors.password, password);
      await page.click(selectors.submit);

      const succeeded = await this.waitForSuccess(page);
      if (!succeeded) {
        // Un échec ne doit jamais marquer le contexte comme authentifié : on
        // sort avant toute écriture dans authenticatedUserIdsByContext.
        throw new AuthenticationFailedError(userId);
      }

      const authenticatedUserIds = this.authenticatedUserIdsByContext.get(context) ?? new Set();
      authenticatedUserIds.add(userId);
      this.authenticatedUserIdsByContext.set(context, authenticatedUserIds);
    } finally {
      await page.close();
    }
  }

  /**
   * Course entre les critères configurés : résout dès que le premier des
   * critères présents réussit, sans attendre l'expiration du ou des autres
   * (`Promise.any`, pas `Promise.all`). Chaque critère perdant reste
   * consommé proprement par `Promise.any` — aucune promesse rejetée
   * tardivement ne fuit en dehors de cette méthode.
   */
  private async waitForSuccess(page: Page): Promise<boolean> {
    const timeout = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const { successUrl, successSelector } = this.options.auth;
    const checks: Promise<void>[] = [];

    if (successUrl !== undefined) {
      checks.push(page.waitForURL(successUrl, { timeout }));
    }

    if (successSelector !== undefined) {
      checks.push(page.waitForSelector(successSelector, { timeout }).then(() => undefined));
    }

    try {
      await Promise.any(checks);
      return true;
    } catch {
      return false;
    }
  }
}

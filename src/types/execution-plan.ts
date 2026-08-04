import type { RawDynamicRoute, RawStaticRoute } from "./route.js";

/**
 * Vue immuable d'une route au sein du plan : copie indépendante de la route
 * de configuration d'origine, jamais un alias vers `config.routes` (RFC-008,
 * correction post-revue). Le plan doit rester un snapshot figé même si la
 * configuration chargée est modifiée après sa construction.
 */
export type PlannedRouteSnapshot =
  | Readonly<RawStaticRoute>
  | (Readonly<Omit<RawDynamicRoute, "parameters">> & {
      readonly parameters: Readonly<Record<string, string>>;
    });

/** Route résolue au sein d'un run, avec son utilisateur effectif (RFC-008). */
export interface PlannedRoute {
  readonly route: PlannedRouteSnapshot;
  /** `undefined` : capture publique, sans authentification. */
  readonly user: string | undefined;
}

/** Run résolu, routes dans l'ordre exact de `run.routes`. */
export interface PlannedRun {
  readonly runName: string;
  readonly order: number;
  readonly routes: readonly PlannedRoute[];
}

/**
 * Plan d'exécution typé (RFC-008) : runs triés par `order` (égalité → ordre
 * du fichier), construit avant toute ouverture de navigateur.
 */
export type ExecutionPlan = readonly PlannedRun[];

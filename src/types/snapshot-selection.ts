/**
 * Portée d'exécution demandée par la CLI (RFC-010) :
 * - `all` : tous les runs, plus les routes standalone (comportement par défaut, sans option) ;
 * - `run` : un seul run (`--runName`) ; `--partial` n'a, en V1, aucun effet
 *   supplémentaire — un run ne capture déjà que ses routes explicitement
 *   référencées et activées ;
 * - `route` : une route isolée, hors run (`--route`, avec `--user` optionnel) ;
 * - `run-route` : une seule route d'un run donné (`--runName` + `--route`).
 */
export type SnapshotSelection =
  | { readonly kind: "all" }
  | { readonly kind: "run"; readonly runName: string }
  | { readonly kind: "route"; readonly routePath: string; readonly user: string | undefined }
  | { readonly kind: "run-route"; readonly runName: string; readonly routePath: string };

import { resolve } from "node:path";
import { chromium, type Browser } from "playwright";
import { FormAuthAdapter } from "../auth/form-auth-adapter.js";
import { loadConfig } from "../config/load-config.js";
import { BaseUrlMissingError } from "../errors/base-url-missing-error.js";
import type { ResolvedConfig } from "../types/config.js";
import type { SnapshotReport } from "../types/snapshot.js";
import type { SnapshotSelection } from "../types/snapshot-selection.js";
import { captureSnapshots } from "./capture-snapshots.js";
import { resolveSnapshotScope } from "./resolve-snapshot-scope.js";

export interface RunSnapshotsOptions {
  readonly cwd: string;
  readonly explicitConfigPath?: string | undefined;
  readonly selection: SnapshotSelection;
  /**
   * Fabrique du navigateur, injectable pour les tests (démontrer la
   * fermeture systématique sans lancer un vrai Chromium à chaque scénario
   * rapide) ; par défaut `() => chromium.launch()` (RFC-010).
   */
  readonly launchBrowser?: (() => Promise<Browser>) | undefined;
}

/**
 * Résout `output.directory` (chemin relatif dans la configuration) en
 * chemin absolu (RFC-010). Règle exacte, volontairement distincte de
 * `resolveConfigPaths` (RFC-002/003, jamais modifié) : résolu par rapport à
 * `project.root` — donc, transitivement, par rapport au répertoire du
 * fichier de configuration uniquement quand `project.root` vaut `.`
 * (défaut) ; si `project.root` pointe ailleurs (ex. `"./app"`), la sortie
 * suit `project.root`, pas le répertoire du fichier de configuration ni le
 * `cwd` du process.
 */
function resolveOutputDirectory(config: ResolvedConfig): string {
  return resolve(config.project.root, config.output.directory);
}

/**
 * Exécute `snaprun` (RFC-010) : charge la configuration, réduit
 * `routes`/`runs` à la portée demandée (RFC-010), puis délègue à
 * `captureSnapshots` (RFC-009).
 *
 * Propriétaire unique du `Browser` : cette fonction est le seul endroit du
 * programme qui appelle `chromium.launch()` (par défaut) ou la fabrique
 * injectée, et le seul qui appelle `browser.close()`. La fermeture est
 * inconditionnelle et couvre toute la durée de vie du navigateur via un
 * `try`/`finally` : elle s'exécute après un succès, après une capture en
 * échec (rapport `succeeded: false`), après un échec d'authentification, et
 * après toute exception inattendue survenant une fois le navigateur lancé —
 * quelle que soit la sélection (`all`, `--runName`, `--route`), puisque
 * toutes passent par ce même appel à `captureSnapshots`. Ce navigateur n'est
 * jamais partagé au-delà de cet appel.
 *
 * @throws {ConfigNotFoundError} Aucun fichier de configuration trouvé.
 * @throws {ConfigInvalidError} Configuration invalide.
 * @throws {BaseUrlMissingError} `project.baseUrl` absent de la configuration.
 * @throws {RunNotFoundError} `--runName` ne correspond à aucun run.
 * @throws {RouteNotFoundError} `--route` ne correspond à aucune route (ou pas à celles du run sélectionné).
 */
export async function runSnapshots(options: RunSnapshotsOptions): Promise<SnapshotReport> {
  const config = loadConfig({
    cwd: options.cwd,
    explicitPath: options.explicitConfigPath,
  });

  if (config.project.baseUrl === undefined) {
    throw new BaseUrlMissingError();
  }

  const { routes, runs } = resolveSnapshotScope(config.routes, config.runs, options.selection);
  const outputDirectory = resolveOutputDirectory(config);

  const auth =
    config.auth !== undefined
      ? new FormAuthAdapter({
          auth: config.auth,
          baseUrl: config.project.baseUrl,
          workingDirectory: config.project.workingDirectory,
        })
      : undefined;

  const launchBrowser = options.launchBrowser ?? ((): Promise<Browser> => chromium.launch());
  const browser = await launchBrowser();

  try {
    return await captureSnapshots({
      browser,
      baseUrl: config.project.baseUrl,
      outputDirectory,
      fullPage: config.output.fullPage,
      routes,
      runs,
      ...(auth !== undefined ? { auth } : {}),
    });
  } finally {
    await browser.close();
  }
}

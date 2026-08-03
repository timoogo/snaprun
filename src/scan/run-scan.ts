import { findConfigFile } from "../config/find-config-file.js";
import { readConfigFile } from "../config/read-config-file.js";
import { resolveConfigPaths } from "../config/resolve-config-paths.js";
import { validateConfig } from "../config/validate-config.js";
import { writeConfigFile } from "../config/write-config-file.js";
import { NextjsRouteScanner } from "../scanners/nextjs-route-scanner.js";
import type { RouteScanner } from "../scanners/scanner.js";
import type { ScanResult } from "../types/scan-result.js";
import { mergeDiscoveredRoutes } from "./merge-discovered-routes.js";
import { replaceRoutesInRawConfig } from "./replace-routes-in-raw-config.js";

export interface RunScanOptions {
  readonly cwd: string;
  /** Valeur de `enableSnapshot` pour les nouvelles routes (option `--default`). */
  readonly defaultEnableSnapshot: boolean;
  /** Injectable pour les tests ; par défaut `NextjsRouteScanner`. */
  readonly scanner?: RouteScanner | undefined;
}

/**
 * Exécute `snaprun scan` (RFC-006) : détecte les routes du projet, fusionne
 * avec la configuration existante (ajout des nouvelles routes uniquement,
 * signalement des routes obsolètes sans suppression) et écrit le fichier de
 * façon atomique — uniquement si de nouvelles routes ont été ajoutées, et en
 * ne modifiant que la clé `routes`.
 *
 * @throws {ConfigNotFoundError} Aucun fichier de configuration trouvé.
 * @throws {ConfigInvalidError} Configuration invalide (avant ou après fusion).
 */
export async function runScan(options: RunScanOptions): Promise<ScanResult> {
  const configFilePath = findConfigFile({ cwd: options.cwd });
  const rawConfig = readConfigFile(configFilePath);
  const validatedConfig = validateConfig(rawConfig, configFilePath);
  const resolvedConfig = resolveConfigPaths(validatedConfig, configFilePath);

  const scanner = options.scanner ?? new NextjsRouteScanner();
  const discoveredRoutes = await scanner.scan(resolvedConfig.project.root);

  const { added, unchanged, obsolete, unsupportedCatchAll, mergedRoutes } = mergeDiscoveredRoutes(
    validatedConfig.routes,
    discoveredRoutes,
    options.defaultEnableSnapshot,
  );

  let fileModified = false;

  if (added.length > 0) {
    const nextRawConfig = replaceRoutesInRawConfig(rawConfig, mergedRoutes);
    validateConfig(nextRawConfig, configFilePath);
    writeConfigFile(configFilePath, nextRawConfig);
    fileModified = true;
  }

  return { configFilePath, added, unchanged, obsolete, unsupportedCatchAll, fileModified };
}

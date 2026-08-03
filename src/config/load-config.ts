import { findConfigFile } from "./find-config-file.js";
import { readConfigFile } from "./read-config-file.js";
import { resolveConfigPaths } from "./resolve-config-paths.js";
import { validateConfig } from "./validate-config.js";
import type { ResolvedConfig } from "../types/config.js";

export interface LoadConfigOptions {
  readonly cwd: string;
  readonly explicitPath?: string | undefined;
}

/**
 * Localise, lit, valide et résout la configuration SnapRun.
 *
 * @throws {ConfigNotFoundError} Aucun fichier de configuration trouvé.
 * @throws {ConfigInvalidError} JSON invalide ou structure ne respectant pas le schéma.
 */
export function loadConfig(options: LoadConfigOptions): ResolvedConfig {
  const configFilePath = findConfigFile(options);
  const rawData = readConfigFile(configFilePath);
  const config = validateConfig(rawData, configFilePath);

  return resolveConfigPaths(config, configFilePath);
}

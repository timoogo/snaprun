import { dirname, resolve } from "node:path";
import type { RawConfig, ResolvedConfig } from "../types/config.js";

/**
 * Résout `project.root` (relatif au fichier de configuration) et
 * `project.workingDirectory` (relatif à `root`) en chemins absolus.
 */
export function resolveConfigPaths(config: RawConfig, configFilePath: string): ResolvedConfig {
  const configDir = dirname(configFilePath);
  const rootDir = resolve(configDir, config.project.root);
  const workingDirectory = resolve(rootDir, config.project.workingDirectory);

  return {
    ...config,
    configFilePath,
    project: {
      ...config.project,
      root: rootDir,
      workingDirectory,
    },
  };
}

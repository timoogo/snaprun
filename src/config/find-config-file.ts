import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { ConfigNotFoundError } from "../errors/config-not-found-error.js";
import { CONFIG_FILE_NAMES } from "./config-file-names.js";

export interface FindConfigFileOptions {
  readonly cwd: string;
  readonly explicitPath?: string | undefined;
}

/**
 * Localise le fichier de configuration à charger.
 *
 * `explicitPath` (`--config`) est prioritaire sur la détection automatique.
 * À défaut, recherche dans `cwd` selon l'ordre de {@link CONFIG_FILE_NAMES}.
 */
export function findConfigFile(options: FindConfigFileOptions): string {
  const { cwd, explicitPath } = options;

  if (explicitPath !== undefined) {
    const resolvedPath = isAbsolute(explicitPath) ? explicitPath : resolve(cwd, explicitPath);

    if (!existsSync(resolvedPath)) {
      throw new ConfigNotFoundError(
        `Fichier de configuration introuvable (chemin explicite --config) : ${resolvedPath}`,
      );
    }

    return resolvedPath;
  }

  for (const fileName of CONFIG_FILE_NAMES) {
    const candidate = join(cwd, fileName);

    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new ConfigNotFoundError(
    `Aucun fichier de configuration trouvé dans ${cwd} (recherchés : ${CONFIG_FILE_NAMES.join(", ")}).`,
  );
}

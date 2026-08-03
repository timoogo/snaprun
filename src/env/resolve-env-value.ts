import { interpolateValue } from "./interpolate-value.js";
import { loadFileEnv } from "./load-file-env.js";

export interface ResolveEnvValueOptions {
  /** Répertoire depuis lequel `.env.local`/`.env` sont recherchés (RFC-003). */
  readonly workingDirectory: string;
  /** Injectable pour les tests ; par défaut `process.env`. */
  readonly processEnv?: NodeJS.ProcessEnv;
}

/**
 * Résout une valeur de configuration : une valeur littérale (sans `${...}`)
 * est retournée telle quelle, sans jamais lire l'environnement ni le disque
 * (priorité 1 de la RFC-003). Sinon, chaque `${VARIABLE}` est résolue via
 * `process.env`, puis `.env.local`, puis `.env`.
 *
 * @throws {EnvVariableMissingError} Si une variable référencée est introuvable.
 */
export function resolveEnvValue(rawValue: string, options: ResolveEnvValueOptions): string {
  if (!rawValue.includes("${")) {
    return rawValue;
  }

  const processEnv = options.processEnv ?? process.env;
  const fileEnv = loadFileEnv(options.workingDirectory);

  return interpolateValue(rawValue, { processEnv, fileEnv });
}

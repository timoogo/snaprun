import { readEnvFile } from "./read-env-file.js";

/**
 * Fusionne les fichiers d'environnement du répertoire de travail :
 * `.env.local` l'emporte sur `.env` en cas de clé commune (RFC-003).
 */
export function loadFileEnv(workingDirectory: string): Record<string, string> {
  const dotEnv = readEnvFile(workingDirectory, ".env");
  const dotEnvLocal = readEnvFile(workingDirectory, ".env.local");

  return { ...dotEnv, ...dotEnvLocal };
}

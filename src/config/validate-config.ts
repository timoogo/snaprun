import { configSchema } from "../schemas/config.js";
import { ConfigInvalidError } from "../errors/config-invalid-error.js";
import type { RawConfig } from "../types/config.js";

/** Valide les données brutes d'un fichier de configuration avec Zod. */
export function validateConfig(data: unknown, filePath: string): RawConfig {
  const result = configSchema.safeParse(data);

  if (!result.success) {
    throw new ConfigInvalidError(
      `La configuration ne respecte pas la structure attendue : ${filePath}`,
      { cause: result.error },
    );
  }

  return result.data;
}

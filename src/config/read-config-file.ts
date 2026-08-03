import { readFileSync } from "node:fs";
import { ConfigInvalidError } from "../errors/config-invalid-error.js";

/** Lit et parse le JSON brut d'un fichier de configuration. */
export function readConfigFile(filePath: string): unknown {
  const raw = readFileSync(filePath, "utf-8");

  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new ConfigInvalidError(
      `Le fichier de configuration n'est pas un JSON valide : ${filePath}`,
      { cause },
    );
  }
}

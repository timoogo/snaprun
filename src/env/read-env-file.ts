import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "dotenv";

/**
 * Lit et parse un fichier `.env` ; retourne `{}` s'il n'existe pas.
 *
 * Le parsing délègue à `dotenv.parse()` (RFC-003, correction demandée après
 * revue) : seule l'API de parsing est utilisée, jamais `dotenv.config()`,
 * afin de ne jamais écrire dans `process.env` — SnapRun garde la main sur
 * l'ordre de priorité (process.env > .env.local > .env).
 */
export function readEnvFile(workingDirectory: string, fileName: string): Record<string, string> {
  const filePath = join(workingDirectory, fileName);

  if (!existsSync(filePath)) {
    return {};
  }

  return parse(readFileSync(filePath, "utf-8"));
}

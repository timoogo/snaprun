import { stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Fallback isolé (RFC-005) : retourne le premier répertoire existant parmi
 * `candidates` (ex. `["app", "src/app"]`), ou `undefined` si aucun n'existe.
 */
export async function findRouterDirectory(
  projectRoot: string,
  candidates: readonly string[],
): Promise<string | undefined> {
  for (const candidate of candidates) {
    const fullPath = join(projectRoot, candidate);

    if (await isDirectory(fullPath)) {
      return fullPath;
    }
  }

  return undefined;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

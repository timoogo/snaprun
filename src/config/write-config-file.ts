import { renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Écrit un objet de configuration de façon atomique : fichier temporaire
 * dans le même répertoire puis renommage (RFC-006), pour ne jamais laisser
 * un fichier de configuration partiellement écrit en cas d'interruption.
 */
export function writeConfigFile(filePath: string, data: unknown): void {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const tempPath = join(dirname(filePath), `.snaprun-config-${process.pid}-${Date.now()}.tmp`);

  writeFileSync(tempPath, content, "utf-8");
  renameSync(tempPath, filePath);
}

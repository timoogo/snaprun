#!/usr/bin/env node
/**
 * Génère `src/generated/version.ts` à partir de `package.json`.
 *
 * Ce script s'exécute au moment du build (jamais au runtime du CLI) afin
 * d'éviter une lecture disque de `package.json` à chaque exécution de
 * `snaprun`, tout en gardant `package.json` comme unique source de vérité
 * pour le nom, la version et la description du package.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));

const outDir = join(rootDir, "src", "generated");
const outFile = join(outDir, "version.ts");

const content = `// Fichier généré automatiquement par scripts/generate-version.mjs.
// Ne pas éditer manuellement : régénéré à chaque build depuis package.json.

export const CLI_NAME = ${JSON.stringify(pkg.name)};
export const CLI_VERSION = ${JSON.stringify(pkg.version)};
export const CLI_DESCRIPTION = ${JSON.stringify(pkg.description)};
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, content);

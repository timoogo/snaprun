import { extractPathParameterNames } from "./extract-path-parameter-names.js";

export interface ParameterDiscrepancies {
  /** Noms référencés dans `path` mais absents de `parameters`. */
  readonly missing: readonly string[];
  /** Clés de `parameters` non référencées dans `path`. */
  readonly unknown: readonly string[];
}

/**
 * Compare les paramètres déclarés dans `path` (segments `[name]`) à ceux
 * fournis dans `parameters`. Logique unique partagée par la validation Zod
 * (`src/schemas/route.ts`) et la résolution de chemin (RFC-004) : la
 * cohérence structurelle est la même que `snapshotPath` soit fourni ou non.
 */
export function computeParameterDiscrepancies(
  path: string,
  parameters: Readonly<Record<string, string>>,
): ParameterDiscrepancies {
  const pathParameterNames = extractPathParameterNames(path);

  const missing = pathParameterNames.filter((name) => parameters[name] === undefined);
  const unknown = Object.keys(parameters).filter((name) => !pathParameterNames.includes(name));

  return { missing, unknown };
}

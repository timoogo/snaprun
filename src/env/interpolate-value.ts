import { EnvVariableMissingError } from "../errors/env-variable-missing-error.js";

const PLACEHOLDER_PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

export interface InterpolateContext {
  readonly processEnv: NodeJS.ProcessEnv;
  readonly fileEnv: Record<string, string>;
}

/**
 * Remplace chaque `${VARIABLE}` d'une chaîne par sa valeur résolue.
 * Supporte plusieurs interpolations par chaîne. N'exécute jamais de code :
 * substitution de texte pure, aucun `eval`.
 *
 * @throws {EnvVariableMissingError} Si une variable référencée est introuvable.
 */
export function interpolateValue(rawValue: string, context: InterpolateContext): string {
  return rawValue.replace(PLACEHOLDER_PATTERN, (_match, variableName: string) =>
    resolveVariable(variableName, context),
  );
}

function resolveVariable(name: string, context: InterpolateContext): string {
  const fromProcessEnv = context.processEnv[name];
  if (fromProcessEnv !== undefined) {
    return fromProcessEnv;
  }

  const fromFileEnv = context.fileEnv[name];
  if (fromFileEnv !== undefined) {
    return fromFileEnv;
  }

  throw new EnvVariableMissingError(name);
}

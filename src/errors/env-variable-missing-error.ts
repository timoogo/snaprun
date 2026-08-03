import { SnapRunError } from "./snaprun-error.js";

/** Le message ne porte que le nom de la variable : jamais de valeur, jamais de secret. */
export class EnvVariableMissingError extends SnapRunError {
  readonly code = "ENV_VARIABLE_MISSING";
  readonly variableName: string;

  constructor(variableName: string) {
    super(`Variable d'environnement manquante : ${variableName}`);
    this.variableName = variableName;
  }
}

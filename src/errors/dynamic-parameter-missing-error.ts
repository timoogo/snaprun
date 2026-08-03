import { SnapRunError } from "./snaprun-error.js";

export class DynamicParameterMissingError extends SnapRunError {
  readonly code = "DYNAMIC_PARAMETER_MISSING";
  readonly routeId: string;
  readonly parameterName: string;

  constructor(routeId: string, parameterName: string) {
    super(`Paramètre dynamique manquant pour la route '${routeId}' : ${parameterName}`);
    this.routeId = routeId;
    this.parameterName = parameterName;
  }
}

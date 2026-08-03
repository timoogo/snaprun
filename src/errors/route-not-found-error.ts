import { SnapRunError } from "./snaprun-error.js";

export class RouteNotFoundError extends SnapRunError {
  readonly code = "ROUTE_NOT_FOUND";
  readonly routeId: string;

  constructor(routeId: string) {
    super(`Route introuvable : ${routeId}`);
    this.routeId = routeId;
  }
}

import { SnapRunError } from "./snaprun-error.js";

/** `run.user` et `route.user` sont tous deux définis et diffèrent (RFC-008). */
export class UserConflictError extends SnapRunError {
  readonly code = "USER_CONFLICT";
  readonly runName: string;
  readonly routeId: string;
  readonly runUser: string;
  readonly routeUser: string;

  constructor(runName: string, routeId: string, runUser: string, routeUser: string) {
    super(
      `Conflit d'utilisateur entre le run "${runName}" (${runUser}) et la route "${routeId}" (${routeUser})`,
    );
    this.runName = runName;
    this.routeId = routeId;
    this.runUser = runUser;
    this.routeUser = routeUser;
  }
}

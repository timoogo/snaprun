import { SnapRunError } from "./snaprun-error.js";

export class UserNotFoundError extends SnapRunError {
  readonly code = "USER_NOT_FOUND";
  readonly userId: string;

  constructor(userId: string) {
    super(`Utilisateur introuvable dans la configuration d'authentification : ${userId}`);
    this.userId = userId;
  }
}

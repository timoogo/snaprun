import { SnapRunError } from "./snaprun-error.js";

/** Le message ne porte jamais l'email/mot de passe utilisés, seulement l'identifiant utilisateur. */
export class AuthenticationFailedError extends SnapRunError {
  readonly code = "AUTHENTICATION_FAILED";
  readonly userId: string;

  constructor(userId: string) {
    super(`Échec de l'authentification pour l'utilisateur : ${userId}`);
    this.userId = userId;
  }
}

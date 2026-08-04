import { SnapRunError } from "./snaprun-error.js";

export class RunNotFoundError extends SnapRunError {
  readonly code = "RUN_NOT_FOUND";
  readonly runName: string;

  constructor(runName: string) {
    super(`Run introuvable : ${runName}`);
    this.runName = runName;
  }
}

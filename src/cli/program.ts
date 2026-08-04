import { Command } from "commander";
import { CLI_DESCRIPTION, CLI_NAME, CLI_VERSION } from "../generated/version.js";
import { registerDefaultCommand } from "./commands/default.js";
import { registerScanCommand } from "./commands/scan.js";

/** Construit le programme CLI de SnapRun. */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(CLI_DESCRIPTION)
    .version(CLI_VERSION, "-v, --version", "Affiche la version de SnapRun")
    .option("--debug", "Affiche la pile d'appels complète et la cause d'une erreur (RFC-010)");

  registerDefaultCommand(program);
  registerScanCommand(program);

  return program;
}

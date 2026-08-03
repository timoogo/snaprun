import { Command } from "commander";
import { CLI_DESCRIPTION, CLI_NAME, CLI_VERSION } from "../generated/version.js";
import { registerScanCommand } from "./commands/scan.js";

/** Construit le programme CLI de SnapRun. */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(CLI_DESCRIPTION)
    .version(CLI_VERSION, "-v, --version", "Affiche la version de SnapRun");

  registerScanCommand(program);

  return program;
}

import { Command } from "commander";
import { CLI_DESCRIPTION, CLI_NAME, CLI_VERSION } from "../generated/version.js";

/**
 * Construit le programme CLI de SnapRun.
 *
 * À ce stade (RFC-001), aucune commande métier n'est enregistrée : le
 * programme expose uniquement l'aide et la version.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(CLI_DESCRIPTION)
    .version(CLI_VERSION, "-v, --version", "Affiche la version de SnapRun");

  return program;
}

import { Command } from "commander";
import { SnapRunError } from "../../errors/snaprun-error.js";
import { formatSnapshotReport } from "../../output/format-snapshot-report.js";
import { resolveSnapshotSelection } from "../../snapshots/resolve-snapshot-selection.js";
import { runSnapshots } from "../../snapshots/run-snapshots.js";
import type { GlobalCliOptions } from "../global-cli-options.js";
import { printCliError } from "../print-cli-error.js";

interface DefaultCommandOptions {
  readonly config?: string;
  readonly runName?: string;
  readonly partial?: boolean;
  readonly route?: string;
  readonly user?: string;
}

/**
 * Enregistre l'action par défaut du programme (sans nom de sous-commande,
 * RFC-010) : capture tous les runs, ou une portée réduite selon les options
 * (`--runName`, `--partial`, `--route`, `--user`).
 */
export function registerDefaultCommand(program: Command): void {
  program
    .option("--config <path>", "Chemin explicite vers le fichier de configuration")
    .option("--runName <name>", "N'exécute qu'un seul run")
    .option(
      "--partial",
      "Limite un run à ses routes explicitement référencées et activées (nécessite --runName ; en V1, comportement déjà identique au mode normal)",
    )
    .option("--route <path>", "Capture une seule route, identifiée par son chemin")
    .option("--user <name>", "Utilisateur pour --route utilisée hors run")
    .action(async (options: DefaultCommandOptions, command: Command) => {
      const { debug } = command.optsWithGlobals<GlobalCliOptions>();

      try {
        const selection = resolveSnapshotSelection(options);
        const report = await runSnapshots({
          cwd: process.cwd(),
          explicitConfigPath: options.config,
          selection,
        });

        console.log(formatSnapshotReport(report));
        process.exitCode = report.succeeded ? 0 : 1;
      } catch (error) {
        if (error instanceof SnapRunError) {
          printCliError(error, debug === true);
          process.exitCode = 1;
          return;
        }

        throw error;
      }
    });
}

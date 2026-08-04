import { Command, Option } from "commander";
import { formatScanSummary } from "../../output/format-scan-summary.js";
import { runScan } from "../../scan/run-scan.js";
import { SnapRunError } from "../../errors/snaprun-error.js";
import type { GlobalCliOptions } from "../global-cli-options.js";
import { printCliError } from "../print-cli-error.js";

interface ScanCommandOptions {
  readonly default: "enabled" | "disabled";
}

/** Enregistre `snaprun scan` sur le programme CLI (RFC-006). */
export function registerScanCommand(program: Command): void {
  program
    .command("scan")
    .description("Détecte les routes du projet Next.js et met à jour la configuration.")
    .addOption(
      new Option("--default <mode>", "Valeur de enableSnapshot pour les nouvelles routes ajoutées")
        .choices(["enabled", "disabled"])
        .default("disabled"),
    )
    .action(async (options: ScanCommandOptions, command: Command) => {
      const { debug } = command.optsWithGlobals<GlobalCliOptions>();

      try {
        const result = await runScan({
          cwd: process.cwd(),
          defaultEnableSnapshot: options.default === "enabled",
        });

        console.log(formatScanSummary(result));
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

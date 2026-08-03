import type { z } from "zod";
import type { configSchema } from "../schemas/config.js";

/**
 * Configuration brute : résultat direct de la validation Zod.
 *
 * Les valeurs par défaut du schéma (ex. `project.autoStart`, `output`,
 * `routes`, `runs`) sont déjà appliquées, mais les chemins (`project.root`,
 * `project.workingDirectory`) restent relatifs, tels qu'écrits dans le
 * fichier de configuration.
 */
export type RawConfig = z.infer<typeof configSchema>;

/**
 * Configuration résolue : dérivée de {@link RawConfig} en remplaçant
 * `project.root` et `project.workingDirectory` par leurs chemins absolus
 * (RFC-002). C'est cette forme que consomment les commandes.
 */
export interface ResolvedConfig extends Omit<RawConfig, "project"> {
  readonly configFilePath: string;
  readonly project: Omit<RawConfig["project"], "root" | "workingDirectory"> & {
    readonly root: string;
    readonly workingDirectory: string;
  };
}

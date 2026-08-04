import { join } from "node:path";

export type SnapshotTarget =
  | {
      readonly kind: "run";
      readonly runName: string;
      readonly index: number;
      readonly routeId: string;
    }
  | { readonly kind: "standalone"; readonly routeId: string };

/**
 * Chemin de fichier déterministe d'une capture (RFC-009) :
 * - run : `<outputDirectory>/<runName>/<NN>-<routeId>.png`, `NN` la position
 *   1-indexée de la route dans l'ordre de capture du run (zéro-paddée sur au
 *   moins 2 chiffres) ;
 * - standalone : `<outputDirectory>/standalone/<routeId>.png`, sans préfixe
 *   numérique (aucun ordre de run ne s'applique).
 */
export function computeSnapshotFilePath(outputDirectory: string, target: SnapshotTarget): string {
  if (target.kind === "standalone") {
    return join(outputDirectory, "standalone", `${target.routeId}.png`);
  }

  const sequence = String(target.index).padStart(2, "0");
  return join(outputDirectory, target.runName, `${sequence}-${target.routeId}.png`);
}

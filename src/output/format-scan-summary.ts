import { routeHasPlaceholderParameters } from "../scan/route-has-placeholder-parameters.js";
import type { ScanResult } from "../types/scan-result.js";

/** Formate le résultat de `snaprun scan` pour la sortie console (RFC-006). */
export function formatScanSummary(result: ScanResult): string {
  const lines: string[] = [`Configuration : ${result.configFilePath}`, ""];

  lines.push(`Ajoutées (${result.added.length})`);
  for (const route of result.added) {
    const placeholderNotice = routeHasPlaceholderParameters(route)
      ? " — configuration manuelle des paramètres requise avant activation"
      : "";
    lines.push(`  + ${route.path} (${route.id})${placeholderNotice}`);
  }

  lines.push(`Inchangées (${result.unchanged.length})`);

  lines.push(`Potentiellement obsolètes (${result.obsolete.length})`);
  for (const route of result.obsolete) {
    lines.push(`  ? ${route.path} (${route.id})`);
  }

  lines.push(
    `Routes dynamiques non prises en charge (catch-all) (${result.unsupportedCatchAll.length})`,
  );
  for (const route of result.unsupportedCatchAll) {
    lines.push(`  ! ${route.path} — non configurable automatiquement, non ajoutée`);
  }

  lines.push("");
  lines.push(result.fileModified ? "Fichier de configuration modifié." : "Fichier inchangé.");

  return lines.join("\n");
}

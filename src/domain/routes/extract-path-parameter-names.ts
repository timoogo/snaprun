/**
 * Segment dynamique reconnu : `[name]` (RFC-004).
 *
 * Point d'extension unique pour RFC-005 : les segments Next.js `[...slug]`
 * (catch-all) et `[[...slug]]` (catch-all optionnel) s'ajouteront ici, sans
 * modifier les appelants (schéma de validation, résolveur de chemin).
 */
const PARAMETER_PATTERN = /\[([A-Za-z_][A-Za-z0-9_]*)\]/g;

/** Extrait, dans l'ordre d'apparition et sans doublon, les noms de paramètres d'un chemin. */
export function extractPathParameterNames(path: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const match of path.matchAll(PARAMETER_PATTERN)) {
    const name = match[1];
    if (name !== undefined && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

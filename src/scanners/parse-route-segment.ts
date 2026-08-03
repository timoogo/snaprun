export type RouteSegmentKind = "static" | "dynamic" | "catch-all" | "optional-catch-all";

export interface ParsedRouteSegment {
  readonly kind: RouteSegmentKind;
}

const OPTIONAL_CATCH_ALL_PATTERN = /^\[\[\.\.\.[A-Za-z_][A-Za-z0-9_]*]]$/;
const CATCH_ALL_PATTERN = /^\[\.\.\.[A-Za-z_][A-Za-z0-9_]*]$/;
const DYNAMIC_PATTERN = /^\[[A-Za-z_][A-Za-z0-9_]*]$/;

/**
 * Classifie un segment de chemin Next.js (nom de dossier ou de fichier sans
 * extension) : statique, dynamique (`[id]`), catch-all (`[...slug]`) ou
 * catch-all optionnel (`[[...slug]]`).
 *
 * Point d'extension unique (RFC-005) pour une future résolution complète des
 * segments catch-all — non implémentée ici, seulement reconnue.
 */
export function parseRouteSegment(segment: string): ParsedRouteSegment {
  if (OPTIONAL_CATCH_ALL_PATTERN.test(segment)) {
    return { kind: "optional-catch-all" };
  }

  if (CATCH_ALL_PATTERN.test(segment)) {
    return { kind: "catch-all" };
  }

  if (DYNAMIC_PATTERN.test(segment)) {
    return { kind: "dynamic" };
  }

  return { kind: "static" };
}

/** Un segment est dynamique dès lors qu'il n'est pas classifié `static`. */
export function isDynamicSegment(segment: string): boolean {
  return parseRouteSegment(segment).kind !== "static";
}

/** Vrai pour un dossier de type route group App Router : `(marketing)`. */
export function isRouteGroupSegment(segment: string): boolean {
  return /^\([^/]+\)$/.test(segment);
}

/**
 * Marqueurs de route interceptante App Router (`(.)`, `(..)`, `(..)(..)`,
 * `(...)`), toujours accolés au nom du segment intercepté (ex. `(.)photo`).
 *
 * RFC-005 (V1) : leur URL canonique ne peut pas être déterminée proprement
 * sans résoudre le nombre de niveaux remontés par rapport à la position du
 * dossier dans l'arborescence — non implémenté ici. Cette fonction sert
 * uniquement à les détecter pour les exclure du scan en sécurité (voir
 * `discoverAppRoutes`), jamais à les transformer en segment d'URL.
 */
const INTERCEPTING_ROUTE_PREFIXES = ["(..)(..)", "(...)", "(..)", "(.)"] as const;

export function isInterceptingRouteSegment(segment: string): boolean {
  return INTERCEPTING_ROUTE_PREFIXES.some((prefix) => segment.startsWith(prefix));
}

/** Router Next.js d'origine d'une route découverte. */
export type RouterKind = "app" | "pages";

/**
 * Route découverte par un {@link RouteScanner} (RFC-005). `path` conserve les
 * segments dynamiques littéraux (`[id]`, `[...slug]`, `[[...slug]]`),
 * compatibles avec la syntaxe attendue par le modèle de route de RFC-004.
 */
export interface DiscoveredRoute {
  readonly path: string;
  readonly filePath: string;
  readonly router: RouterKind;
  readonly isDynamic: boolean;
}

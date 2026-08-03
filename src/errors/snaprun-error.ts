/**
 * Base commune des erreurs applicatives de SnapRun.
 *
 * Le message reste volontairement lisible sans détail technique brut ; la
 * cause d'origine (erreur de parsing, erreurs Zod, etc.) est portée par la
 * propriété standard `cause` et n'est destinée à être affichée qu'en mode
 * `--debug` (introduit par une RFC ultérieure).
 */
export abstract class SnapRunError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

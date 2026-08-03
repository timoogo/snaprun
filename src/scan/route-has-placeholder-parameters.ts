import type { RawRoute } from "../types/route.js";
import { PLACEHOLDER_PARAMETER_VALUE } from "./placeholder-parameter-value.js";

/** Vrai si une route dynamique porte au moins une valeur de paramètre placeholder (RFC-006). */
export function routeHasPlaceholderParameters(route: RawRoute): boolean {
  return (
    route.isDynamic === true &&
    Object.values(route.parameters).some((value) => value === PLACEHOLDER_PARAMETER_VALUE)
  );
}

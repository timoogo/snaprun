import { z } from "zod";
import { computeParameterDiscrepancies } from "../domain/routes/compute-parameter-discrepancies.js";

/**
 * Route dont le chemin contient des segments dynamiques (`[param]`).
 *
 * La cohérence entre `path` et `parameters` est vérifiée systématiquement au
 * parsing, que `snapshotPath` soit fourni ou non (RFC-004, correction post-
 * revue) : `snapshotPath` ne remplace que l'URL finale visitée, il ne
 * dispense jamais de la validation du modèle.
 */
export const dynamicRouteSchema = z
  .object({
    id: z.string(),
    path: z.string(),
    isDynamic: z.literal(true),
    parameters: z.record(z.string(), z.string()),
    enableSnapshot: z.boolean(),
    user: z.string().optional(),
    /** Remplace uniquement l'URL finale visitée quand fourni (RFC-004). */
    snapshotPath: z.string().optional(),
  })
  .strict()
  .superRefine((route, ctx) => {
    const { missing, unknown } = computeParameterDiscrepancies(route.path, route.parameters);

    for (const name of missing) {
      ctx.addIssue({
        code: "custom",
        message: `Paramètre dynamique manquant : ${name}`,
        path: ["parameters", name],
      });
    }

    for (const name of unknown) {
      ctx.addIssue({
        code: "custom",
        message: `Paramètre dynamique inconnu : ${name}`,
        path: ["parameters", name],
      });
    }
  });

/** Route à chemin fixe : `isDynamic` absent ou explicitement `false`. */
export const staticRouteSchema = z
  .object({
    id: z.string(),
    path: z.string(),
    isDynamic: z.literal(false).optional(),
    enableSnapshot: z.boolean(),
    user: z.string().optional(),
    /** Prioritaire sur `path` quand fourni (RFC-004). */
    snapshotPath: z.string().optional(),
  })
  .strict();

export const routeSchema = z.union([dynamicRouteSchema, staticRouteSchema]);

/**
 * Liste de routes : chaque élément est validé par {@link routeSchema}, et les
 * identifiants (`id`) doivent être uniques dans l'ensemble de la liste
 * (critère d'acceptation RFC-004).
 */
export const routesSchema = z.array(routeSchema).superRefine((routes, ctx) => {
  const seenIds = new Set<string>();

  routes.forEach((route, index) => {
    if (seenIds.has(route.id)) {
      ctx.addIssue({
        code: "custom",
        message: `Identifiant de route dupliqué : ${route.id}`,
        path: [index, "id"],
      });
    }

    seenIds.add(route.id);
  });
});

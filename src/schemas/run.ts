import { z } from "zod";

/**
 * Un run associe un ensemble ordonné de routes (référencées par `id`, RFC-004)
 * à un utilisateur optionnel. `order` détermine l'ordre d'exécution des runs
 * entre eux (RFC-008) ; l'ordre du tableau `routes` est l'ordre exact des
 * captures au sein du run.
 */
export const runSchema = z
  .object({
    runName: z.string(),
    user: z.string().optional(),
    order: z.number(),
    routes: z.array(z.string()),
  })
  .strict();

/**
 * Liste de runs : chaque élément est validé par {@link runSchema}, et les
 * noms (`runName`) doivent être uniques dans l'ensemble de la liste
 * (RFC-008, cohérent avec l'unicité des `id` de route en RFC-004).
 */
export const runsSchema = z.array(runSchema).superRefine((runs, ctx) => {
  const seenNames = new Set<string>();

  runs.forEach((run, index) => {
    if (seenNames.has(run.runName)) {
      ctx.addIssue({
        code: "custom",
        message: `Nom de run dupliqué : ${run.runName}`,
        path: [index, "runName"],
      });
    }

    seenNames.add(run.runName);
  });
});

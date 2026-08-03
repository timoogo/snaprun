import { z } from "zod";

const authSelectorsSchema = z.object({
  email: z.string(),
  password: z.string(),
  submit: z.string(),
});

/**
 * `email`/`password` peuvent contenir des valeurs littérales ou des
 * `${VARIABLE}` résolus par `resolveEnvValue` (RFC-003) au moment de la
 * connexion — jamais au chargement de la configuration, pour ne jamais
 * logger un secret par accident lors d'une validation.
 */
const userCredentialsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

/**
 * Section optionnelle de la configuration (RFC-002 : une configuration sans
 * authentification est valide). Quand elle est présente, sa structure reste
 * requise dans son intégralité. La stratégie de succès de connexion
 * (`successUrl` et/ou `successSelector`) doit définir au moins un critère
 * (RFC-007) : au moins l'un des deux doit permettre de déterminer qu'une
 * connexion a réussi.
 */
export const authSchema = z
  .object({
    loginRoute: z.string(),
    selectors: authSelectorsSchema,
    successUrl: z.string().optional(),
    successSelector: z.string().optional(),
    users: z.record(z.string(), userCredentialsSchema),
  })
  .superRefine((auth, ctx) => {
    if (auth.successUrl === undefined && auth.successSelector === undefined) {
      ctx.addIssue({
        code: "custom",
        message:
          "auth.successUrl ou auth.successSelector doit être défini (stratégie de succès de connexion requise).",
        path: ["successUrl"],
      });
    }
  });

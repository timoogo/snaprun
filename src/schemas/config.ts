import { z } from "zod";

/**
 * Seul `project` est une section obligatoire (RFC-002, correction demandée
 * après revue). Toutes ses valeurs ont des valeurs par défaut sûres, sauf
 * `baseUrl` et `startCommand` :
 * - `root` défaut `"."` ;
 * - `workingDirectory` défaut `"."`, donc résolu sur `root` quand absent ;
 * - `autoStart` défaut `false` pour ne jamais lancer un processus
 *   implicitement ;
 * - `baseUrl` et `startCommand` restent optionnels au chargement de la
 *   configuration : leur nécessité dépend de la commande exécutée (une
 *   capture a besoin de `baseUrl`, un auto-start a besoin de
 *   `startCommand`) et sera validée par ces commandes futures, pas ici.
 */
const projectSchema = z.object({
  root: z.string().default("."),
  workingDirectory: z.string().default("."),
  baseUrl: z.string().optional(),
  startCommand: z.string().optional(),
  autoStart: z.boolean().default(false),
});

/** Section optionnelle : valeurs par défaut si `output` (ou un de ses champs) est absent. */
const outputSchema = z
  .object({
    directory: z.string().default("./snapshots"),
    fullPage: z.boolean().default(true),
  })
  .default({});

const authSelectorsSchema = z.object({
  email: z.string(),
  password: z.string(),
  submit: z.string(),
});

/**
 * Section optionnelle (une configuration sans authentification est valide).
 * Quand elle est présente, sa structure reste requise dans son intégralité.
 * La structure des utilisateurs (`auth.users`) est définie par RFC-007
 * (authentification) : à ce stade, seule la présence d'un objet est validée.
 */
const authSchema = z.object({
  loginRoute: z.string(),
  selectors: authSelectorsSchema,
  users: z.record(z.string(), z.unknown()),
});

/**
 * La structure des éléments de `routes` et `runs` est définie respectivement
 * par RFC-004 (routes) et RFC-008 (runs) : à ce stade, seule la présence de
 * tableaux est validée. Les deux sections sont optionnelles (défaut `[]`).
 */
export const configSchema = z.object({
  project: projectSchema,
  output: outputSchema,
  auth: authSchema.optional(),
  routes: z.array(z.unknown()).default([]),
  runs: z.array(z.unknown()).default([]),
});

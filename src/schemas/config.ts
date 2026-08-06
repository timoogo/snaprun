import { z } from "zod";
import { authSchema } from "./auth.js";
import { routesSchema } from "./route.js";
import { runsSchema } from "./run.js";

/**
 * Only `project` is required (RFC-002, review follow-up). Every field has a
 * safe default except `baseUrl` and `startCommand`:
 * - `root` defaults to `"."`;
 * - `workingDirectory` defaults to `"."`, so it resolves from `root` when omitted;
 * - `autoStart` defaults to `false` so SnapRun never starts a process implicitly;
 * - `baseUrl` and `startCommand` stay optional during configuration loading:
 *   whether they are required depends on the command being executed
 *   (snapshot capture needs `baseUrl`, auto-start needs `startCommand`) and
 *   is validated by those commands instead of here.
 */
const projectSchema = z.object({
  root: z.string().default("."),
  workingDirectory: z.string().default("."),
  baseUrl: z.string().optional(),
  startCommand: z.string().optional(),
  autoStart: z.boolean().default(false),
});

/** Optional section with defaults when `output` or one of its fields is omitted. */
const outputSchema = z
  .object({
    directory: z.string().default("./snapshots"),
    fullPage: z.boolean().default(true),
    structure: z.enum(["flat", "run", "scope"]).default("flat"),
  })
  .default({});

/**
 * `routes` uses the complete model defined by RFC-004 (`src/schemas/route.ts`).
 * `runs` uses the complete model defined by RFC-008 (`src/schemas/run.ts`).
 * Both sections are optional and default to `[]`.
 */
export const configSchema = z.object({
  project: projectSchema,
  output: outputSchema,
  auth: authSchema.optional(),
  routes: routesSchema.default([]),
  runs: runsSchema.default([]),
});

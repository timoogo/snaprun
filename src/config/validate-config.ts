import { configSchema } from "../schemas/config.js";
import { ConfigInvalidError } from "../errors/config-invalid-error.js";
import type { RawConfig } from "../types/config.js";

/** Validate raw configuration file data with Zod. */
export function validateConfig(data: unknown, filePath: string): RawConfig {
  const result = configSchema.safeParse(data);

  if (!result.success) {
    throw new ConfigInvalidError(
      `Configuration does not match the expected schema: ${filePath}`,
      { cause: result.error },
    );
  }

  return result.data;
}

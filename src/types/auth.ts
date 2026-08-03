import type { z } from "zod";
import type { authSchema } from "../schemas/auth.js";

/** Section `auth` validée (RFC-007). */
export type AuthConfig = z.infer<typeof authSchema>;

export type UserCredentials = AuthConfig["users"][string];

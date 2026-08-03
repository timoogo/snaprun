import type { z } from "zod";
import type { dynamicRouteSchema, routeSchema, staticRouteSchema } from "../schemas/route.js";

export type RawStaticRoute = z.infer<typeof staticRouteSchema>;
export type RawDynamicRoute = z.infer<typeof dynamicRouteSchema>;

/** Route statique ou dynamique, telle que validée par le schéma. */
export type RawRoute = z.infer<typeof routeSchema>;

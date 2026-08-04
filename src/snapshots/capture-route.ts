import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Page } from "playwright";
import { resolveRoutePath } from "../routes/resolve-route-path.js";
import type { RawRoute } from "../types/route.js";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface CaptureRouteOptions {
  readonly page: Page;
  readonly baseUrl: string;
  readonly route: RawRoute;
  /** Chemin de fichier PNG cible, déjà calculé (RFC-009). */
  readonly filePath: string;
  readonly fullPage: boolean;
  readonly timeoutMs?: number;
}

/**
 * Capture une route unique (RFC-009) : résout son URL (statique, dynamique ou
 * `snapshotPath`, RFC-004), navigue, attend la stabilité du réseau
 * (`networkidle`) puis écrit un PNG au chemin donné. Crée les dossiers
 * intermédiaires si nécessaire.
 */
export async function captureRoute(options: CaptureRouteOptions): Promise<void> {
  const { page, baseUrl, route, filePath, fullPage } = options;
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const path = resolveRoutePath(route);
  const url = new URL(path, baseUrl).toString();

  mkdirSync(dirname(filePath), { recursive: true });

  await page.goto(url, { waitUntil: "networkidle", timeout });
  await page.screenshot({ path: filePath, fullPage });
}

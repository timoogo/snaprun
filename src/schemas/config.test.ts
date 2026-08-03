import { describe, expect, it } from "vitest";
import { configSchema } from "./config.js";

function fullConfig(): unknown {
  return {
    project: {
      root: ".",
      workingDirectory: ".",
      baseUrl: "http://localhost:3000",
      startCommand: "pnpm dev",
      autoStart: true,
    },
    output: { directory: "./snapshots", fullPage: true },
    auth: {
      loginRoute: "/sign-in",
      selectors: {
        email: "input[name='email']",
        password: "input[name='password']",
        submit: "button[type='submit']",
      },
      users: {},
    },
    routes: [],
    runs: [],
  };
}

describe("configSchema", () => {
  it("accepte une configuration complète et valide", () => {
    const result = configSchema.safeParse(fullConfig());

    expect(result.success).toBe(true);
  });

  it("accepte une configuration réellement minimale (seul 'project' vide)", () => {
    const result = configSchema.safeParse({ project: {} });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        project: { root: ".", workingDirectory: ".", autoStart: false },
        output: { directory: "./snapshots", fullPage: true },
        routes: [],
        runs: [],
      });
    }
  });

  it("rejette une configuration sans la section 'project'", () => {
    const result = configSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("accepte une configuration minimale avec seulement project.baseUrl (cas scan)", () => {
    const result = configSchema.safeParse({ project: { baseUrl: "http://localhost:3000" } });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.baseUrl).toBe("http://localhost:3000");
      expect(result.data.project.autoStart).toBe(false);
    }
  });

  it("laisse 'auth' absent (undefined) quand la section n'est pas fournie", () => {
    const result = configSchema.safeParse({ project: {} });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.auth).toBeUndefined();
    }
  });

  it("applique '.' par défaut à project.workingDirectory absent", () => {
    const result = configSchema.safeParse({ project: { root: "./app" } });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.workingDirectory).toBe(".");
    }
  });

  it("applique les valeurs par défaut de 'output' quand seul un de ses champs est fourni", () => {
    const result = configSchema.safeParse({ project: {}, output: { fullPage: false } });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.output).toEqual({ directory: "./snapshots", fullPage: false });
    }
  });

  it("rejette un type invalide (autoStart non booléen)", () => {
    const result = configSchema.safeParse({ project: { autoStart: "oui" } });

    expect(result.success).toBe(false);
  });

  it("rejette des sélecteurs d'authentification incomplets quand 'auth' est présent", () => {
    const config = fullConfig() as { auth: { selectors: Record<string, unknown> } };
    delete config.auth.selectors["submit"];

    const result = configSchema.safeParse(config);

    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createProgram } from "./program.js";

describe("createProgram", () => {
  it("expose le nom et la description du package", () => {
    const program = createProgram();

    expect(program.name()).toBe("snaprun");
    expect(program.description()).toContain("SnapRun");
  });

  it("n'enregistre aucune commande métier", () => {
    const program = createProgram();

    expect(program.commands).toHaveLength(0);
  });

  it("affiche l'aide sans erreur", () => {
    const program = createProgram();

    expect(() => program.helpInformation()).not.toThrow();
    expect(program.helpInformation()).toContain("snaprun");
  });
});

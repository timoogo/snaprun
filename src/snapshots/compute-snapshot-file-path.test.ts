import { sep } from "node:path";
import { describe, expect, it } from "vitest";
import { computeSnapshotFilePath } from "./compute-snapshot-file-path.js";

describe("computeSnapshotFilePath", () => {
  it("calcule le chemin d'une route de run avec le préfixe numérique zéro-paddé", () => {
    const filePath = computeSnapshotFilePath("/out", {
      kind: "run",
      runName: "member",
      index: 1,
      routeId: "member-home",
    });

    expect(filePath).toBe(["", "out", "member", "01-member-home.png"].join(sep));
  });

  it("n'ajoute pas de padding supplémentaire au-delà de 2 chiffres", () => {
    const filePath = computeSnapshotFilePath("/out", {
      kind: "run",
      runName: "member",
      index: 123,
      routeId: "route",
    });

    expect(filePath).toBe(["", "out", "member", "123-route.png"].join(sep));
  });

  it("calcule le chemin d'une route standalone sans préfixe numérique", () => {
    const filePath = computeSnapshotFilePath("/out", {
      kind: "standalone",
      routeId: "member-calendar",
    });

    expect(filePath).toBe(["", "out", "standalone", "member-calendar.png"].join(sep));
  });
});

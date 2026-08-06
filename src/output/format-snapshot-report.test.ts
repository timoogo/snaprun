import { describe, expect, it } from "vitest";
import type { SnapshotReport } from "../types/snapshot.js";
import { formatSnapshotReport } from "./format-snapshot-report.js";

describe("formatSnapshotReport", () => {
  it("liste les runs et leurs captures, avec le statut final de succès", () => {
    const report: SnapshotReport = {
      succeeded: true,
      durationMs: 42,
      runs: [
        {
          runName: "member",
          snapshots: [{ routeId: "home", filePath: "/out/member/01-home.png", durationMs: 10 }],
        },
      ],
      standalone: [],
      failure: undefined,
    };

    const output = formatSnapshotReport(report);

    expect(output).toContain("Run: member (1)");
    expect(output).toContain("home");
    expect(output).toContain("/out/member/01-home.png");
    expect(output).toContain("Completed successfully (42 ms).");
  });

  it("liste les captures standalone séparément", () => {
    const report: SnapshotReport = {
      succeeded: true,
      durationMs: 5,
      runs: [],
      standalone: [{ routeId: "extra", filePath: "/out/standalone/extra.png", durationMs: 3 }],
      failure: undefined,
    };

    expect(formatSnapshotReport(report)).toContain("Standalone (1)");
  });

  it("affiche l'échec et le statut final d'échec quand le rapport a échoué", () => {
    const report: SnapshotReport = {
      succeeded: false,
      durationMs: 7,
      runs: [],
      standalone: [],
      failure: { routeId: "bad", runName: "member", message: "connection refused" },
    };

    const output = formatSnapshotReport(report);

    expect(output).toContain("Failed: bad (run member) - connection refused");
    expect(output).toContain("Completed with failures (7 ms).");
  });

  it("n'affiche pas de mention de run pour l'échec d'une route standalone", () => {
    const report: SnapshotReport = {
      succeeded: false,
      durationMs: 7,
      runs: [],
      standalone: [],
      failure: { routeId: "bad", runName: undefined, message: "boom" },
    };

    expect(formatSnapshotReport(report)).toContain("Failed: bad - boom");
  });
});

import type { CapturedSnapshot, SnapshotReport } from "../types/snapshot.js";

/** Format the `snaprun` report (RFC-009) for console output (RFC-010). */
export function formatSnapshotReport(report: SnapshotReport): string {
  const lines: string[] = [];

  for (const run of report.runs) {
    lines.push(`Run: ${run.runName} (${run.snapshots.length})`);
    lines.push(...run.snapshots.map(formatSnapshotLine));
  }

  if (report.standalone.length > 0) {
    lines.push(`Standalone (${report.standalone.length})`);
    lines.push(...report.standalone.map(formatSnapshotLine));
  }

  if (report.failure !== undefined) {
    const runLabel = report.failure.runName !== undefined ? ` (run ${report.failure.runName})` : "";
    lines.push(`Failed: ${report.failure.routeId}${runLabel} - ${report.failure.message}`);
  }

  lines.push("");
  lines.push(
    report.succeeded
      ? `Completed successfully (${report.durationMs} ms).`
      : `Completed with failures (${report.durationMs} ms).`,
  );

  return lines.join("\n");
}

function formatSnapshotLine(snapshot: CapturedSnapshot): string {
  return `  - ${snapshot.routeId} -> ${snapshot.filePath} (${snapshot.durationMs} ms)`;
}

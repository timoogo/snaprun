/** A successful PNG capture (RFC-009). */
export interface CapturedSnapshot {
  readonly routeId: string;
  readonly filePath: string;
  readonly durationMs: number;
}

/** Successful captures for a run, in the exact `run.routes` order. */
export interface RunSnapshotResult {
  readonly runName: string;
  readonly snapshots: readonly CapturedSnapshot[];
}

/**
 * Details about the failure that interrupted capture (fail-fast, RFC-009).
 * `runName` is `undefined` for a route captured outside a run (standalone).
 */
export interface SnapshotFailure {
  readonly routeId: string;
  readonly runName: string | undefined;
  readonly message: string;
}

/**
 * Final report for a capture execution (RFC-009). Always returned on both
 * success and failure: when `succeeded` is `false`, `runs` and `standalone`
 * contain only the captures that completed before fail-fast stopped the run,
 * and `failure` describes the route that caused the failure.
 */
export interface SnapshotReport {
  readonly succeeded: boolean;
  readonly durationMs: number;
  readonly runs: readonly RunSnapshotResult[];
  readonly standalone: readonly CapturedSnapshot[];
  readonly failure: SnapshotFailure | undefined;
}

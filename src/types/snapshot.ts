/** Une capture PNG réussie (RFC-009). */
export interface CapturedSnapshot {
  readonly routeId: string;
  readonly filePath: string;
  readonly durationMs: number;
}

/** Captures réussies d'un run, dans l'ordre exact de `run.routes`. */
export interface RunSnapshotResult {
  readonly runName: string;
  readonly snapshots: readonly CapturedSnapshot[];
}

/**
 * Détail de l'échec ayant interrompu la capture (fail-fast, RFC-009).
 * `runName` est `undefined` pour une route capturée hors run (standalone).
 */
export interface SnapshotFailure {
  readonly routeId: string;
  readonly runName: string | undefined;
  readonly message: string;
}

/**
 * Rapport final d'une exécution de captures (RFC-009). Toujours renvoyé,
 * succès ou échec : en cas d'échec (`succeeded: false`), `runs` et
 * `standalone` ne contiennent que les captures effectivement réussies avant
 * l'arrêt fail-fast, et `failure` décrit la route ayant fait échouer le run.
 */
export interface SnapshotReport {
  readonly succeeded: boolean;
  readonly durationMs: number;
  readonly runs: readonly RunSnapshotResult[];
  readonly standalone: readonly CapturedSnapshot[];
  readonly failure: SnapshotFailure | undefined;
}

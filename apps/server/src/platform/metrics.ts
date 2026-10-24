import client from 'prom-client';

/** Prometheus-Metriken unter `/metrics` (REQ-OPS-002). */
export function createMetrics() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Dauer der HTTP-Requests',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 0.8, 1.5, 3],
    registers: [registry],
  });

  const wsConnections = new client.Gauge({
    name: 'ws_connections',
    help: 'Offene WebSocket-Verbindungen',
    registers: [registry],
  });

  const jobsProcessed = new client.Counter({
    name: 'jobs_processed_total',
    help: 'Verarbeitete Jobs',
    labelNames: ['queue', 'outcome'] as const,
    registers: [registry],
  });

  // Betriebsmetriken für die Alarmregeln (ADR-0017): Werte werden beim Abruf von /metrics gelesen
  const probes: OpsProbes = {
    ready: async () => false,
    maintenance: async () => false,
    lastBackupAt: async () => null,
  };
  new client.Gauge({
    name: 'app_ready',
    help: 'Anwendung bereit (Readiness inkl. Datenbank): 1 = ja, 0 = nein',
    registers: [registry],
    async collect() {
      this.set((await probes.ready().catch(() => false)) ? 1 : 0);
    },
  });
  new client.Gauge({
    name: 'campusmarkt_maintenance_mode',
    help: 'Wartungsmodus aktiv (MAINTENANCE_MODE oder Einstellung): 1 = ja, 0 = nein',
    registers: [registry],
    async collect() {
      this.set((await probes.maintenance().catch(() => false)) ? 1 : 0);
    },
  });
  new client.Gauge({
    name: 'campusmarkt_backup_last_success_timestamp_seconds',
    help: 'Zeitpunkt der letzten erfolgreichen Sicherung (Unix-Sekunden, 0 = noch keine)',
    registers: [registry],
    async collect() {
      const at = await probes.lastBackupAt().catch(() => null);
      this.set(at ? Math.floor(at.getTime() / 1000) : 0);
    },
  });

  return {
    registry,
    httpDuration,
    wsConnections,
    jobsProcessed,
    /** Wird im Composition Root verdrahtet, sobald Datenbank und Einstellungen bereitstehen. */
    bindProbes(next: Partial<OpsProbes>) {
      Object.assign(probes, next);
    },
  };
}

export interface OpsProbes {
  ready(): Promise<boolean>;
  maintenance(): Promise<boolean>;
  lastBackupAt(): Promise<Date | null>;
}

export type Metrics = ReturnType<typeof createMetrics>;

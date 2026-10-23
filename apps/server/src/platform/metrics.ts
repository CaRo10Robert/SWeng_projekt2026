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

  return { registry, httpDuration, wsConnections, jobsProcessed };
}

export type Metrics = ReturnType<typeof createMetrics>;

import pino from 'pino';

/** JSON-Logs auf stdout, ohne personenbezogene Daten (REQ-OPS-002). */
export function createLogger(level: string) {
  return pino({
    level,
    base: { service: 'campusmarkt' },
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers["set-cookie"]',
        '*.password',
        '*.email',
        '*.token',
        'to',
      ],
      censor: '[redacted]',
    },
  });
}

export type Logger = pino.Logger;

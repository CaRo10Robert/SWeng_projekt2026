import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Version des laufenden Servers (REQ-OPS-013): die Angabe aus `apps/server/package.json`. Sie ist die eine Quelle
 * für Release-Tag, Image-Tag, OpenAPI und `/health/live`; die Release-Prüfung (`tests/ops/release-check.mjs`)
 * stellt sicher, dass Tag und alle `package.json` übereinstimmen. `src/platform` und `dist/platform` liegen gleich
 * tief, daher führt derselbe relative Pfad im Quelltext und im Image zur Paketdatei.
 */
export const APP_VERSION: string = (
  JSON.parse(readFileSync(resolve(import.meta.dirname, '../../package.json'), 'utf8')) as { version: string }
).version;

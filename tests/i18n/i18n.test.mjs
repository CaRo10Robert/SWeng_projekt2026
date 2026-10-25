// Übersetzungen der Web-App (REQ-UX-007, ADR-0016). Ausführen: node --test tests/i18n/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkI18n } from '../../scripts/check-i18n.mjs';

test('[AT-UX-007-2] Schlüsselmengen Deutsch und Englisch sind gleich, alle Schlüssel verwendet, ICU gültig, Inhalte übersetzt', async () => {
  const { errors, keys, contents } = await checkI18n();
  assert.deepEqual(errors, []);
  assert.ok(keys > 0, 'keine Schlüssel gefunden');
  assert.ok(contents >= 7, 'Rechtstexte und Hilfe fehlen');
});

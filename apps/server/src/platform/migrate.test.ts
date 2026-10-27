import { describe, expect, it } from 'vitest';
import { unknownMigrations } from './migrate.js';

describe('Migrationen: Datenbank neuer als Code bricht den Start ab (REQ-OPS-005)', () => {
  const files = ['0001_init.sql', '0002_contact_consent.sql', '0003_recht_betrieb.sql'];

  it('alle angewendeten Migrationen sind bekannt → kein Abbruch', () => {
    expect(unknownMigrations(['0001_init.sql', '0002_contact_consent.sql'], files)).toEqual([]);
  });

  it('meldet Migrationen, die nur die Datenbank kennt, sortiert', () => {
    expect(unknownMigrations(['0001_init.sql', '0006_neu.sql', '0005_spaeter.sql'], files)).toEqual(['0005_spaeter.sql', '0006_neu.sql']);
  });
});

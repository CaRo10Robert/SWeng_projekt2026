import { describe, expect, it, vi } from 'vitest';
import { createOps } from './ops.js';
import type { SettingsStore } from './settings.js';

function settingsWith(get: SettingsStore['get']): SettingsStore {
  return { get, set: vi.fn(), remove: vi.fn() } as unknown as SettingsStore;
}

describe('Wartungszustand bei Datenbankausfall (MAN-OPS-011, Befund B-1)', () => {
  it('liefert nach einem Lesefehler den letzten bekannten Zustand, ohne die Datenbank erneut zu fragen', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ on: true, until: null })
      .mockRejectedValue(new Error('connection terminated'));
    const ops = createOps({
      maintenanceFromEnv: false,
      maintenanceUntilFromEnv: null,
      settings: settingsWith(get),
      checkDatabase: async () => false,
      checkMail: async () => true,
      failureBackoffMs: 60_000,
    });
    expect((await ops.maintenance()).active).toBe(true);
    expect((await ops.maintenance()).active).toBe(true);
    expect((await ops.maintenance()).active).toBe(true);
    // Erster Aufruf ok, zweiter scheitert, dritter nutzt den gemerkten Zustand
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('im Normalbetrieb wirkt jede Änderung sofort (keine Zwischenspeicherung)', async () => {
    const get = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ on: true, until: null });
    const ops = createOps({
      maintenanceFromEnv: false,
      maintenanceUntilFromEnv: null,
      settings: settingsWith(get),
      checkDatabase: async () => true,
      checkMail: async () => true,
    });
    expect((await ops.maintenance()).active).toBe(false);
    expect((await ops.maintenance()).active).toBe(true);
  });

  it('Statusseite meldet die Datenbank als gestört, ohne auf die Datenbank zu warten', async () => {
    const ops = createOps({
      maintenanceFromEnv: false,
      maintenanceUntilFromEnv: null,
      settings: settingsWith(vi.fn().mockRejectedValue(new Error('down'))),
      checkDatabase: async () => false,
      checkMail: async () => true,
    });
    const status = await ops.status();
    expect(status.status).toBe('degraded');
    expect(status.services).toContainEqual({ id: 'database', status: 'disrupted' });
  });
});

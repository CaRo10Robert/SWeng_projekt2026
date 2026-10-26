import pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { createPool, guardPool } from './db.js';

describe('Datenbankausfall beendet den Prozess nicht (MAN-OPS-011, Befund B-1)', () => {
  it('ohne Listener würde ein Verbindungsfehler den Prozess beenden', () => {
    const pool = new pg.Pool({ connectionString: 'postgres://invalid' });
    expect(() => pool.emit('error', new Error('terminating connection due to administrator command'))).toThrow();
  });

  it('guardPool fängt Verbindungsfehler ab und meldet sie', () => {
    const onError = vi.fn();
    const pool = guardPool(new pg.Pool({ connectionString: 'postgres://invalid' }), onError);
    expect(() => pool.emit('error', new Error('terminating connection due to administrator command'))).not.toThrow();
    expect(onError).toHaveBeenCalledOnce();
  });

  it('createPool hängt den Listener immer an', async () => {
    const pool = createPool('postgres://invalid', 1);
    expect(pool.listenerCount('error')).toBe(1);
    await pool.end();
  });
});

import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, sep } from 'node:path';
import type { StoragePort } from '../ports/index.js';

/** StoragePort → Dateisystem (Docker-Volume `uploads`, ADR-0007). Ein S3-Adapter ist der Produktivpfad. */
export function createFsStorage(root: string): StoragePort {
  const resolveKey = (key: string) => {
    const path = normalize(join(root, key));
    if (relative(root, path).startsWith('..')) throw new Error('Ungültiger Speicherschlüssel');
    return path;
  };

  return {
    async put(key, data) {
      const path = resolveKey(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
    },
    async get(key) {
      try {
        return await readFile(resolveKey(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
    async delete(key) {
      await rm(resolveKey(key), { force: true });
    },
    async deletePrefix(prefix) {
      await rm(resolveKey(prefix), { recursive: true, force: true });
    },
    async listOlderThan(prefix, olderThan) {
      const base = resolveKey(prefix);
      let entries: string[];
      try {
        entries = await readdir(base, { recursive: true });
      } catch {
        return [];
      }
      const result: string[] = [];
      for (const entry of entries) {
        const info = await stat(join(base, entry));
        if (info.isFile() && info.mtime < olderThan) result.push(join(prefix, entry).split(sep).join('/'));
      }
      return result;
    },
  };
}

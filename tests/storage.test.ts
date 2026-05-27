import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../src/core/storage/storage-service.js';
import { LocalStorageAdapter } from '../src/core/storage/adapters/local-storage.js';
import { join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';

describe('StorageService', () => {
  const testDir = join(process.cwd(), 'test-storage');
  let storage: StorageService;

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    storage = new StorageService(new LocalStorageAdapter(testDir));
  });

  it('saves and retrieves a file', async () => {
    await storage.put('test.txt', 'hello world');
    const content = await storage.get('test.txt');
    expect(content?.toString()).toBe('hello world');
  });

  it('checks if file exists', async () => {
    await storage.put('exists.txt', 'yes');
    expect(await storage.exists('exists.txt')).toBe(true);
    expect(await storage.exists('no.txt')).toBe(false);
  });

  it('deletes a file', async () => {
    await storage.put('delete.txt', 'bye');
    await storage.delete('delete.txt');
    expect(await storage.exists('delete.txt')).toBe(false);
  });

  it('returns correct url', () => {
    expect(storage.url('avatar.png')).toBe('/storage/avatar.png');
  });
});

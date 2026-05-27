import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { StorageAdapter } from '../adapter.js';

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private rootDir: string = join(process.cwd(), 'storage'),
    private baseUrl: string = '/storage'
  ) {
    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir, { recursive: true });
    }
  }

  async save(path: string, content: Buffer | string): Promise<string> {
    const fullPath = join(this.rootDir, path);
    const dir = dirname(fullPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, content);
    return path;
  }

  async get(path: string): Promise<Buffer | null> {
    const fullPath = join(this.rootDir, path);
    if (!existsSync(fullPath)) return null;
    return readFileSync(fullPath);
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.rootDir, path);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }

  async exists(path: string): Promise<boolean> {
    return existsSync(join(this.rootDir, path));
  }

  getUrl(path: string): string {
    return `${this.baseUrl}/${path}`.replace(/\/+/g, '/');
  }
}

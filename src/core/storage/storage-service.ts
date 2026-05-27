import { StorageAdapter } from './adapter.js';

export class StorageService {
  constructor(private adapter: StorageAdapter) {}

  async put(path: string, content: Buffer | string): Promise<string> {
    return this.adapter.save(path, content);
  }

  async get(path: string): Promise<Buffer | null> {
    return this.adapter.get(path);
  }

  async delete(path: string): Promise<void> {
    return this.adapter.delete(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.adapter.exists(path);
  }

  url(path: string): string {
    return this.adapter.getUrl(path);
  }
}

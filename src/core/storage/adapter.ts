export interface StorageAdapter {
  save(path: string, content: Buffer | string): Promise<string>;
  get(path: string): Promise<Buffer | null>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): string;
}

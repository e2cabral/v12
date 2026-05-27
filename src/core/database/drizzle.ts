import type { DatabaseAdapter } from './adapter.js';
import { QueryOptions, Repository, PaginatedResult } from './repository.js';

export class DrizzleAdapter implements DatabaseAdapter {
  constructor(
    public readonly db: any,
    private readonly options: { name?: string; connect?: () => Promise<void>; disconnect?: () => Promise<void> } = {},
  ) {}

  get name() {
    return this.options.name ?? 'drizzle';
  }

  async connect() {
    if (this.options.connect) {
      await this.options.connect();
    }
  }

  async disconnect() {
    if (this.options.disconnect) {
      await this.options.disconnect();
    }
  }

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }
}

export abstract class DrizzleRepository<T, CreateDTO = any, UpdateDTO = any> extends Repository<
  T,
  CreateDTO,
  UpdateDTO
> {
  constructor(
    protected readonly db: any,
    protected readonly table: any,
    resourceName: string,
    options?: { tenantId?: string; auditService?: any },
  ) {
    super(resourceName, options);
  }

  // Drizzle common operations are usually more specific to the driver, 
  // but we can provide a base for the most common ones if we assume some conventions or use the 'db' methods directly.
  // Note: Drizzle syntax varies between SQL dialects, so these are generic placeholders.
  
  abstract findAll(): Promise<T[]>;
  abstract find(options?: QueryOptions): Promise<T[]>;
  abstract findPaginated(options?: QueryOptions): Promise<PaginatedResult<T>>;
  abstract findById(id: string): Promise<T | null>;
  abstract create(data: CreateDTO): Promise<T>;
  abstract update(id: string, data: UpdateDTO): Promise<T>;
  abstract delete(id: string): Promise<boolean>;
}

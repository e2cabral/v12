import type { AuditService } from '../audit/audit-service.js';

export type PaginationOptions = {
  page?: number;
  limit?: number;
};

export type FilterValue = any | {
  $eq?: any;
  $ne?: any;
  $gt?: any;
  $gte?: any;
  $lt?: any;
  $lte?: any;
  $like?: string;
  $in?: any[];
};

export type Filters = Record<string, FilterValue>;

export type SortOptions = {
  field: string;
  order: 'asc' | 'desc';
};

export type QueryOptions = PaginationOptions & {
  where?: Filters;
  sort?: SortOptions | SortOptions[];
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
};

export interface BaseRepository<T, CreateDTO = any, UpdateDTO = any> {
  findAll(): Promise<T[]>;
  find(options?: QueryOptions): Promise<T[]>;
  findPaginated(options?: QueryOptions): Promise<PaginatedResult<T>>;
  findById(id: string): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export abstract class Repository<T, CreateDTO = any, UpdateDTO = any>
  implements BaseRepository<T, CreateDTO, UpdateDTO>
{
  protected tenantId?: string;
  protected auditService?: AuditService;
  protected resourceName: string;

  constructor(resourceName: string, options?: { tenantId?: string; auditService?: AuditService }) {
    this.resourceName = resourceName;
    this.tenantId = options?.tenantId;
    this.auditService = options?.auditService;
  }

  abstract findAll(): Promise<T[]>;
  abstract find(options?: QueryOptions): Promise<T[]>;
  abstract findPaginated(options?: QueryOptions): Promise<PaginatedResult<T>>;
  abstract findById(id: string): Promise<T | null>;
  abstract create(data: CreateDTO): Promise<T>;
  abstract update(id: string, data: UpdateDTO): Promise<T>;
  abstract delete(id: string): Promise<boolean>;

  protected getPagination(options?: PaginationOptions) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 10);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  protected createPaginatedResult(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    const lastPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit,
      },
    };
  }

  protected async beforeCreate(data: CreateDTO): Promise<CreateDTO> {
    if (this.tenantId && typeof data === 'object' && data !== null) {
      (data as any).tenantId = this.tenantId;
    }
    return data;
  }

  protected async afterCreate(data: T): Promise<void> {
    if (this.auditService) {
      await this.auditService.log({
        action: 'CREATE',
        resource: this.resourceName,
        resourceId: (data as any).id,
        newData: data,
      });
    }
  }

  protected async beforeUpdate(id: string, data: UpdateDTO): Promise<UpdateDTO> {
    return data;
  }

  protected async afterUpdate(data: T): Promise<void> {
    if (this.auditService) {
      await this.auditService.log({
        action: 'UPDATE',
        resource: this.resourceName,
        resourceId: (data as any).id,
        newData: data,
      });
    }
  }

  protected async beforeDelete(id: string): Promise<void> {}

  protected async afterDelete(id: string): Promise<void> {
    if (this.auditService) {
      await this.auditService.log({
        action: 'DELETE',
        resource: this.resourceName,
        resourceId: id,
      });
    }
  }

  protected applyTenantFilter(filters: Filters = {}): Filters {
    if (this.tenantId) {
      return { ...filters, tenantId: this.tenantId };
    }
    return filters;
  }
}

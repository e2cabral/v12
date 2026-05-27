import type { DatabaseAdapter } from './adapter.js';
import { QueryOptions, Repository, Filters, SortOptions } from './repository.js';

export interface PrismaClientLike {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  [key: string]: any;
}

export class PrismaAdapter implements DatabaseAdapter {
  constructor(public readonly client: PrismaClientLike) {}

  get name() {
    return 'prisma';
  }

  async connect() {
    await this.client.$connect();
  }

  async disconnect() {
    await this.client.$disconnect();
  }

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.client.$transaction(fn);
  }
}

export abstract class PrismaRepository<T, CreateDTO = any, UpdateDTO = any> extends Repository<
  T,
  CreateDTO,
  UpdateDTO
> {
  constructor(
    protected readonly model: any,
    resourceName: string,
    options?: { tenantId?: string; auditService?: any },
  ) {
    super(resourceName, options);
  }

  async findAll(): Promise<T[]> {
    const where = this.applyTenantFilter();
    return this.model.findMany({ where });
  }

  async find(options?: QueryOptions): Promise<T[]> {
    const where = this.mapFilters(this.applyTenantFilter(options?.where));
    const orderBy = this.mapSort(options?.sort);
    const { limit, skip } = this.getPagination(options);

    return this.model.findMany({
      where,
      orderBy,
      skip,
      take: options?.limit ? limit : undefined,
    });
  }

  async findPaginated(options?: QueryOptions) {
    const { page, limit, skip } = this.getPagination(options);
    const where = this.mapFilters(this.applyTenantFilter(options?.where));
    const orderBy = this.mapSort(options?.sort);

    const [data, total] = await Promise.all([
      this.model.findMany({ where, orderBy, skip, take: limit }),
      this.model.count({ where }),
    ]);
    return this.createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string): Promise<T | null> {
    const where = this.applyTenantFilter({ id });
    return this.model.findFirst({ where });
  }

  async create(data: CreateDTO): Promise<T> {
    const prepared = await this.beforeCreate(data);
    const result = await this.model.create({ data: prepared });
    await this.afterCreate(result);
    return result;
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    const prepared = await this.beforeUpdate(id, data);
    const result = await this.model.update({ where: { id }, data: prepared });
    await this.afterUpdate(result);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    await this.beforeDelete(id);
    await this.model.delete({ where: { id } });
    await this.afterDelete(id);
    return true;
  }

  protected mapFilters(filters?: Filters) {
    if (!filters) return {};
    const where: any = {};

    for (const [field, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const prismaFilter: any = {};
        if ('$eq' in value) prismaFilter.equals = value.$eq;
        if ('$ne' in value) prismaFilter.not = value.$ne;
        if ('$gt' in value) prismaFilter.gt = value.$gt;
        if ('$gte' in value) prismaFilter.gte = value.$gte;
        if ('$lt' in value) prismaFilter.lt = value.$lt;
        if ('$lte' in value) prismaFilter.lte = value.$lte;
        if ('$in' in value) prismaFilter.in = value.$in;
        if ('$like' in value) {
          prismaFilter.contains = value.$like.replace(/%/g, '');
          prismaFilter.mode = 'insensitive';
        }
        where[field] = prismaFilter;
      } else {
        where[field] = value;
      }
    }

    return where;
  }

  protected mapSort(sort?: SortOptions | SortOptions[]) {
    if (!sort) return undefined;
    const sorts = Array.isArray(sort) ? sort : [sort];
    return sorts.map((s) => ({ [s.field]: s.order }));
  }
}

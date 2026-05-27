import type { DatabaseAdapter } from './adapter.js';
import { QueryOptions, Repository, Filters, SortOptions } from './repository.js';

export interface TypeOrmDataSourceLike {
  initialize(): Promise<any>;
  destroy(): Promise<void>;
  transaction<T>(fn: (entityManager: any) => Promise<T>): Promise<T>;
  [key: string]: any;
}

export class TypeOrmAdapter implements DatabaseAdapter {
  constructor(public readonly dataSource: TypeOrmDataSourceLike) {}

  get name() {
    return 'typeorm';
  }

  async connect() {
    if (!(this.dataSource as any).isInitialized) {
      await this.dataSource.initialize();
    }
  }

  async disconnect() {
    await this.dataSource.destroy();
  }

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(fn);
  }
}

export abstract class TypeOrmRepository<T, CreateDTO = any, UpdateDTO = any> extends Repository<
  T,
  CreateDTO,
  UpdateDTO
> {
  constructor(
    protected readonly repository: any,
    resourceName: string,
    options?: { tenantId?: string; auditService?: any },
  ) {
    super(resourceName, options);
  }

  async findAll(): Promise<T[]> {
    const where = await this.mapFilters(this.applyTenantFilter());
    return this.repository.find({ where });
  }

  async find(options?: QueryOptions): Promise<T[]> {
    const where = await this.mapFilters(this.applyTenantFilter(options?.where));
    const order = this.mapSort(options?.sort);
    const { limit, skip } = this.getPagination(options);

    return this.repository.find({
      where,
      order,
      skip,
      take: options?.limit ? limit : undefined,
    });
  }

  async findPaginated(options?: QueryOptions) {
    const { page, limit, skip } = this.getPagination(options);
    const where = await this.mapFilters(this.applyTenantFilter(options?.where));
    const order = this.mapSort(options?.sort);

    const [data, total] = await this.repository.findAndCount({
      where,
      order,
      skip,
      take: limit,
    });
    return this.createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string): Promise<T | null> {
    const where = await this.mapFilters(this.applyTenantFilter({ id }));
    return this.repository.findOne({ where });
  }

  async create(data: CreateDTO): Promise<T> {
    const prepared = await this.beforeCreate(data);
    const entity = this.repository.create(prepared);
    const result = await this.repository.save(entity);
    await this.afterCreate(result);
    return result;
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    const prepared = await this.beforeUpdate(id, data);
    await this.repository.update(id, prepared);
    const result = await this.findById(id);
    if (!result) throw new Error('Entity not found after update');
    await this.afterUpdate(result);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    await this.beforeDelete(id);
    const result = await this.repository.delete(id);
    await this.afterDelete(id);
    return (result.affected ?? 0) > 0;
  }

  protected async mapFilters(filters?: Filters) {
    if (!filters) return {};
    const where: any = {};

    try {
      // @ts-ignore
      const typeorm = await import('typeorm');
      const { ILike, In, MoreThan, MoreThanOrEqual, LessThan, LessThanOrEqual, Not } = typeorm;

      for (const [field, value] of Object.entries(filters)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if ('$eq' in value) where[field] = value.$eq;
          if ('$ne' in value) where[field] = Not(value.$ne);
          if ('$gt' in value) where[field] = MoreThan(value.$gt);
          if ('$gte' in value) where[field] = MoreThanOrEqual(value.$gte);
          if ('$lt' in value) where[field] = LessThan(value.$lt);
          if ('$lte' in value) where[field] = LessThanOrEqual(value.$lte);
          if ('$in' in value) where[field] = In(value.$in);
          if ('$like' in value) where[field] = ILike(value.$like);
        } else {
          where[field] = value;
        }
      }
    } catch (e) {
      // Fallback to simple equality if typeorm operators are not available
      return filters;
    }

    return where;
  }

  protected mapSort(sort?: SortOptions | SortOptions[]) {
    if (!sort) return undefined;
    const sorts = Array.isArray(sort) ? sort : [sort];
    const result: any = {};
    for (const s of sorts) {
      result[s.field] = s.order.toUpperCase();
    }
    return result;
  }
}

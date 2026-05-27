import type { DatabaseAdapter } from './adapter.js';
import { QueryOptions, Repository, Filters, SortOptions } from './repository.js';

export interface MongooseConnectionLike {
  asPromise?(): Promise<any>;
  close(): Promise<void>;
  startSession(): Promise<any>;
  [key: string]: any;
}

export class MongooseAdapter implements DatabaseAdapter {
  constructor(public readonly connection: MongooseConnectionLike) {}

  get name() {
    return 'mongoose';
  }

  async connect() {
    if (this.connection.asPromise) {
      await this.connection.asPromise();
    }
  }

  async disconnect() {
    await this.connection.close();
  }

  async transaction<T>(fn: (session: any) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export abstract class MongooseRepository<T, CreateDTO = any, UpdateDTO = any> extends Repository<
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
    return this.model.find(where).lean();
  }

  async find(options?: QueryOptions): Promise<T[]> {
    const where = this.mapFilters(this.applyTenantFilter(options?.where));
    const sort = this.mapSort(options?.sort);
    const { limit, skip } = this.getPagination(options);

    let query = this.model.find(where);
    if (sort) query = query.sort(sort);
    query = query.skip(skip);
    if (options?.limit) query = query.limit(limit);

    return query.lean();
  }

  async findPaginated(options?: QueryOptions) {
    const { page, limit, skip } = this.getPagination(options);
    const where = this.mapFilters(this.applyTenantFilter(options?.where));
    const sort = this.mapSort(options?.sort);

    let query = this.model.find(where);
    if (sort) query = query.sort(sort);

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      this.model.countDocuments(where),
    ]);
    return this.createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string): Promise<T | null> {
    const where = this.applyTenantFilter({ _id: id });
    return this.model.findOne(where).lean();
  }

  async create(data: CreateDTO): Promise<T> {
    const prepared = await this.beforeCreate(data);
    const [result] = await this.model.create([prepared]);
    const resultObj = result.toObject();
    await this.afterCreate(resultObj);
    return resultObj;
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    const prepared = await this.beforeUpdate(id, data);
    const result = await this.model.findByIdAndUpdate(id, prepared, { new: true }).lean();
    if (!result) throw new Error('Entity not found after update');
    await this.afterUpdate(result);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    await this.beforeDelete(id);
    const result = await this.model.findByIdAndDelete(id);
    await this.afterDelete(id);
    return !!result;
  }

  protected mapFilters(filters?: Filters) {
    if (!filters) return {};
    const where: any = {};

    for (const [field, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const mongoFilter: any = {};
        if ('$eq' in value) mongoFilter.$eq = value.$eq;
        if ('$ne' in value) mongoFilter.$ne = value.$ne;
        if ('$gt' in value) mongoFilter.$gt = value.$gt;
        if ('$gte' in value) mongoFilter.$gte = value.$gte;
        if ('$lt' in value) mongoFilter.$lt = value.$lt;
        if ('$lte' in value) mongoFilter.$lte = value.$lte;
        if ('$in' in value) mongoFilter.$in = value.$in;
        if ('$like' in value) {
          mongoFilter.$regex = new RegExp(value.$like.replace(/%/g, ''), 'i');
        }
        where[field] = mongoFilter;
      } else {
        where[field] = value;
      }
    }

    return where;
  }

  protected mapSort(sort?: SortOptions | SortOptions[]) {
    if (!sort) return undefined;
    const sorts = Array.isArray(sort) ? sort : [sort];
    const result: any = {};
    for (const s of sorts) {
      result[s.field] = s.order === 'asc' ? 1 : -1;
    }
    return result;
  }
}

import { describe, expect, it, vi } from 'vitest';
import { TypeOrmAdapter, TypeOrmRepository } from '../src/core/database/typeorm.js';
import { MongooseAdapter, MongooseRepository } from '../src/core/database/mongoose.js';

describe('Database Adapters', () => {
  describe('TypeOrmAdapter', () => {
    it('delegates transaction to datasource', async () => {
      const mockDataSource = {
        transaction: vi.fn().mockImplementation(async (fn) => fn('mock-em')),
        initialize: vi.fn(),
        destroy: vi.fn(),
        isInitialized: true,
      };

      const adapter = new TypeOrmAdapter(mockDataSource as any);
      const result = await adapter.transaction(async (tx) => {
        expect(tx).toBe('mock-em');
        return 'done';
      });

      expect(result).toBe('done');
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('TypeOrmRepository', () => {
    it('performs CRUD operations with hooks', async () => {
      const mockRepo = {
        find: vi.fn().mockResolvedValue([{ id: '1' }]),
        findOne: vi.fn().mockResolvedValue({ id: '1' }),
        create: vi.fn().mockImplementation((d) => d),
        save: vi.fn().mockResolvedValue({ id: '1', name: 'Created' }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
      };

      class TestRepo extends TypeOrmRepository<any> {
        hooks = { beforeCreate: false, afterCreate: false };
        constructor() { super(mockRepo); }
        protected async beforeCreate(d: any) { this.hooks.beforeCreate = true; return d; }
        protected async afterCreate(d: any) { this.hooks.afterCreate = true; }
      }

      const repo = new TestRepo();
      const all = await repo.findAll();
      expect(all).toHaveLength(1);

      const created = await repo.create({ name: 'New' });
      expect(repo.hooks.beforeCreate).toBe(true);
      expect(repo.hooks.afterCreate).toBe(true);
      expect(created.name).toBe('Created');

      const deleted = await repo.delete('1');
      expect(deleted).toBe(true);
    });

    it('calculates skip and limit correctly', () => {
      const mockRepo = { find: vi.fn() };
      class TestRepo extends TypeOrmRepository<any> {
        constructor() { super(mockRepo); }
        public testPagination(opts?: any) { return this.getPagination(opts); }
      }
      const repo = new TestRepo();
      expect(repo.testPagination({ page: 2, limit: 20 })).toEqual({ page: 2, limit: 20, skip: 20 });
      expect(repo.testPagination()).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it('returns paginated results', async () => {
      const mockRepo = {
        findAndCount: vi.fn().mockResolvedValue([[{ id: '1' }], 1]),
      };
      class TestRepo extends TypeOrmRepository<any> {
        constructor() { super(mockRepo); }
      }
      const repo = new TestRepo();
      const result = await repo.findPaginated({ page: 1, limit: 5 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.lastPage).toBe(1);
    });
  });

  describe('MongooseAdapter', () => {
    it('manages sessions for transactions', async () => {
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      const mockConn = {
        startSession: vi.fn().mockResolvedValue(mockSession),
        close: vi.fn(),
      };

      const adapter = new MongooseAdapter(mockConn as any);
      await adapter.transaction(async (session) => {
        expect(session).toBe(mockSession);
      });

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('MongooseRepository', () => {
    it('performs CRUD operations', async () => {
      const mockModel = {
        find: vi.fn().mockReturnValue({ lean: () => Promise.resolve([{ id: '1' }]) }),
        findById: vi.fn().mockReturnValue({ lean: () => Promise.resolve({ id: '1' }) }),
        create: vi.fn().mockImplementation((data) => {
          const doc = { 
            toObject: () => data[0],
            ...data[0]
          };
          return Promise.resolve([doc]);
        }),
        findByIdAndUpdate: vi.fn().mockReturnValue({ lean: () => Promise.resolve({ id: '1', updated: true }) }),
        findByIdAndDelete: vi.fn().mockResolvedValue({ id: '1' }),
      };

      class TestRepo extends MongooseRepository<any> {
        constructor() { super(mockModel); }
      }

      const repo = new TestRepo();
      const all = await repo.findAll();
      expect(all).toHaveLength(1);

      const created = await repo.create({ name: 'Mongo' });
      expect(created.name).toBe('Mongo');

      const updated = await repo.update('1', { name: 'New' });
      expect(updated.updated).toBe(true);
    });
  });
});

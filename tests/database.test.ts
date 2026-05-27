import { describe, expect, it, vi } from 'vitest';
import { PrismaAdapter, PrismaRepository } from '../src/core/database/prisma.js';

describe('Database Layer', () => {
  describe('PrismaAdapter Transactions', () => {
    it('delegates transaction to prisma client', async () => {
      const mockPrisma = {
        $transaction: vi.fn().mockImplementation(async (fn) => fn('mock-tx')),
        $connect: vi.fn(),
        $disconnect: vi.fn(),
      };

      const adapter = new PrismaAdapter(mockPrisma as any);
      const result = await adapter.transaction(async (tx) => {
        expect(tx).toBe('mock-tx');
        return 'done';
      });

      expect(result).toBe('done');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('PrismaRepository Hooks', () => {
    it('calls beforeCreate and afterCreate hooks', async () => {
      const mockModel = {
        create: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      };

      class TestRepository extends PrismaRepository<any> {
        beforeCreateHookCalled = false;
        afterCreateHookCalled = false;

        constructor() {
          super(mockModel);
        }

        protected async beforeCreate(data: any) {
          this.beforeCreateHookCalled = true;
          return { ...data, transformed: true };
        }

        protected async afterCreate(data: any) {
          this.afterCreateHookCalled = true;
        }
      }

      const repo = new TestRepository();
      const result = await repo.create({ name: 'Original' });

      expect(repo.beforeCreateHookCalled).toBe(true);
      expect(mockModel.create).toHaveBeenCalledWith({
        data: { name: 'Original', transformed: true },
      });
      expect(repo.afterCreateHookCalled).toBe(true);
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('calls update hooks', async () => {
      const mockModel = {
        update: vi.fn().mockResolvedValue({ id: '1', name: 'Updated' }),
      };

      class TestRepository extends PrismaRepository<any> {
        beforeUpdateHookCalled = false;
        afterUpdateHookCalled = false;

        constructor() {
          super(mockModel);
        }

        protected async beforeUpdate(id: string, data: any) {
          this.beforeUpdateHookCalled = true;
          return { ...data, id_from_hook: id };
        }

        protected async afterUpdate(data: any) {
          this.afterUpdateHookCalled = true;
        }
      }

      const repo = new TestRepository();
      await repo.update('123', { name: 'New Name' });

      expect(repo.beforeUpdateHookCalled).toBe(true);
      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { name: 'New Name', id_from_hook: '123' },
      });
      expect(repo.afterUpdateHookCalled).toBe(true);
    });

    it('calls delete hooks', async () => {
      const mockModel = {
        delete: vi.fn().mockResolvedValue(true),
      };

      class TestRepository extends PrismaRepository<any> {
        beforeDeleteHookCalled = false;
        afterDeleteHookCalled = false;

        constructor() {
          super(mockModel);
        }

        protected async beforeDelete(id: string) {
          this.beforeDeleteHookCalled = true;
        }

        protected async afterDelete(id: string) {
          this.afterDeleteHookCalled = true;
        }
      }

      const repo = new TestRepository();
      await repo.delete('123');

      expect(repo.beforeDeleteHookCalled).toBe(true);
      expect(mockModel.delete).toHaveBeenCalledWith({ where: { id: '123' } });
      expect(repo.afterDeleteHookCalled).toBe(true);
    });
  });
});

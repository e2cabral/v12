import { describe, expect, it, vi } from 'vitest';
import { PrismaRepository } from '../src/core/database/prisma.js';
import { MongooseRepository } from '../src/core/database/mongoose.js';
import { TypeOrmRepository } from '../src/core/database/typeorm.js';

vi.mock('typeorm', () => ({
  ILike: (v: string) => `ILike(${v})`,
  In: (v: any[]) => `In(${v})`,
  MoreThan: (v: any) => `MoreThan(${v})`,
  MoreThanOrEqual: (v: any) => `MoreThanOrEqual(${v})`,
  LessThan: (v: any) => `LessThan(${v})`,
  LessThanOrEqual: (v: any) => `LessThanOrEqual(${v})`,
  Not: (v: any) => `Not(${v})`,
}));

describe('Query Builder (PrismaAdapter)', () => {
  const mockModel = {
    findMany: vi.fn(),
    count: vi.fn(),
  };

  class TestRepository extends PrismaRepository<any> {
    constructor() {
      super(mockModel);
    }
  }

  it('filters data using $eq operator', async () => {
    const repo = new TestRepository();
    mockModel.findMany.mockResolvedValue([{ id: '1', name: 'John' }]);

    await repo.find({
      where: {
        name: { $eq: 'John' },
      },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { equals: 'John' },
        },
      })
    );
  });

  it('filters data using multiple operators', async () => {
    const repo = new TestRepository();
    mockModel.findMany.mockResolvedValue([]);

    await repo.find({
      where: {
        age: { $gt: 18, $lt: 30 },
        role: 'admin',
      },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          age: { gt: 18, lt: 30 },
          role: 'admin',
        },
      })
    );
  });

  it('filters data using $like operator', async () => {
    const repo = new TestRepository();
    mockModel.findMany.mockResolvedValue([]);

    await repo.find({
      where: {
        email: { $like: '%gmail.com' },
      },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: { contains: 'gmail.com', mode: 'insensitive' },
        },
      })
    );
  });

  it('sorts data correctly', async () => {
    const repo = new TestRepository();
    mockModel.findMany.mockResolvedValue([]);

    await repo.find({
      sort: { field: 'createdAt', order: 'desc' },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }],
      })
    );
  });

  it('handles pagination in findPaginated', async () => {
    const repo = new TestRepository();
    mockModel.findMany.mockResolvedValue([{ id: '1' }]);
    mockModel.count.mockResolvedValue(100);

    const result = await repo.findPaginated({
      page: 2,
      limit: 5,
      where: { active: true },
    });

    expect(mockModel.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: undefined,
      skip: 5,
      take: 5,
    });

    expect(result.meta.total).toBe(100);
    expect(result.meta.page).toBe(2);
    expect(result.meta.lastPage).toBe(20);
  });
});

describe('Query Builder (MongooseAdapter)', () => {
  const mockModel = {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn(),
    countDocuments: vi.fn(),
  };

  class TestRepository extends MongooseRepository<any> {
    constructor() {
      super(mockModel);
    }
  }

  it('translates filters to Mongoose format', async () => {
    const repo = new TestRepository();
    mockModel.lean.mockResolvedValue([]);

    await repo.find({
      where: {
        price: { $gte: 100 },
        tags: { $in: ['electronics'] },
        name: { $like: 'phone' },
      },
    });

    expect(mockModel.find).toHaveBeenCalledWith({
      price: { $gte: 100 },
      tags: { $in: ['electronics'] },
      name: { $regex: /phone/i },
    });
  });

  it('applies sort to Mongoose query', async () => {
    const repo = new TestRepository();
    mockModel.lean.mockResolvedValue([]);

    await repo.find({
      sort: [
        { field: 'category', order: 'asc' },
        { field: 'price', order: 'desc' },
      ],
    });

    expect(mockModel.sort).toHaveBeenCalledWith({
      category: 1,
      price: -1,
    });
  });
});

describe('Query Builder (TypeOrmAdapter)', () => {
  const mockRepo = {
    find: vi.fn().mockResolvedValue([]),
    findAndCount: vi.fn().mockResolvedValue([[], 0]),
  };

  class TestRepository extends TypeOrmRepository<any> {
    constructor() {
      super(mockRepo);
    }
  }

  it('translates filters using TypeORM operators', async () => {
    const repo = new TestRepository();

    await repo.find({
      where: {
        status: 'active',
        stock: { $lt: 10 },
        title: { $like: '%v12%' },
      },
    });

    expect(mockRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'active',
          stock: 'LessThan(10)',
          title: 'ILike(%v12%)',
        },
      })
    );
  });

  it('translates sort to TypeORM format', async () => {
    const repo = new TestRepository();

    await repo.find({
      sort: { field: 'rank', order: 'asc' },
    });

    expect(mockRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { rank: 'ASC' },
      })
    );
  });
});

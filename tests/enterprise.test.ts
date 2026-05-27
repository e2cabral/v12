import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/core/http/app.js';
import { defineModule } from '../src/core/http/module.js';
import { createRouter } from '../src/core/http/router.js';
import { multiTenancy } from '../src/core/multi-tenancy/multi-tenancy.js';
import { Repository } from '../src/core/database/repository.js';
import { AuditService } from '../src/core/audit/audit-service.js';

// Mock Repository implementation
class TestRepository extends Repository<any> {
  public data: any[] = [];

  constructor(options?: any) {
    super('test-resource', options);
  }

  async findAll() {
    return this.data.filter(item => !this.tenantId || item.tenantId === this.tenantId);
  }

  async find(options?: any) {
    const filters = this.applyTenantFilter(options?.where);
    return this.data.filter(item => {
      return Object.entries(filters).every(([key, value]) => item[key] === value);
    });
  }

  async findPaginated(options?: any) {
    const data = await this.find(options);
    return this.createPaginatedResult(data, data.length, 1, 10);
  }

  async findById(id: string) {
    const filters = this.applyTenantFilter({ id });
    return this.data.find(item => {
      return Object.entries(filters).every(([key, value]) => item[key] === value);
    }) || null;
  }

  async create(data: any) {
    const prepared = await this.beforeCreate(data);
    const result = { id: Math.random().toString(), ...prepared };
    this.data.push(result);
    await this.afterCreate(result);
    return result;
  }

  async update(id: string, data: any) {
    const prepared = await this.beforeUpdate(id, data);
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Not found');
    this.data[index] = { ...this.data[index], ...prepared };
    const result = this.data[index];
    await this.afterUpdate(result);
    return result;
  }

  async delete(id: string) {
    await this.beforeDelete(id);
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return false;
    this.data.splice(index, 1);
    await this.afterDelete(id);
    return true;
  }
}

describe('Enterprise Features (Fase 13)', () => {
  it('identifies tenant through multi-tenancy middleware', async () => {
    const router = createRouter();
    router.get('/whoami', {
      handler: async ({ container }) => {
        const tenantId = container.resolve('TenantId');
        return { tenantId };
      }
    });

    const app = await createApp({
      modules: [defineModule({ name: 'test', routes: router })],
      middlewares: [multiTenancy({ header: 'x-v12-tenant' })]
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test/whoami',
      headers: { 'x-v12-tenant': 'tenant-123' }
    });

    expect(response.json()).toEqual({ 
      success: true,
      data: { tenantId: 'tenant-123' } 
    });
  });

  it('automatically filters repository data by tenant', async () => {
    const repo = new TestRepository({ tenantId: 'tenant-A' });
    repo.data = [
      { id: '1', name: 'Item 1', tenantId: 'tenant-A' },
      { id: '2', name: 'Item 2', tenantId: 'tenant-B' },
    ];

    const results = await repo.findAll();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('triggers audit logs on repository actions', async () => {
    const mockLogger = { info: vi.fn() };
    const auditService = new AuditService(mockLogger as any);
    const repo = new TestRepository({ auditService });

    const item = await repo.create({ name: 'Audit Me' });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ 
        audit: expect.objectContaining({ 
          action: 'CREATE',
          resource: 'test-resource'
        }) 
      }),
      expect.stringContaining('Audit Log')
    );

    await repo.update(item.id, { name: 'Updated' });
    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    
    await repo.delete(item.id);
    expect(mockLogger.info).toHaveBeenCalledTimes(3);
  });

  it('initializes OpenTelemetry when enabled', async () => {
    // Apenas verificando se nao quebra e se o decorate funciona
    const app = await createApp({
      telemetry: { serviceName: 'test-app', enabled: true }
    });
    
    expect(app.telemetry).toBeDefined();
    await app.close();
  });
});

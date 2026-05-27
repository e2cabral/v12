import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  generateController,
  generateCrudResource,
  generateFeature,
  generateRepository,
  generateRoute,
  generateSchema,
  generateService,
  registerModuleInApp,
  registerProviderInModule,
  removeCrudResource,
  removeRoute,
} from '../src/cli/scaffold.js';

const tempDirs: string[] = [];

describe('v12 cli scaffolding', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('generates a full feature and registers it in app.ts', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'app.ts'),
      `import { createApp } from './core/http/app.js';
import { UsersModule } from '../features/users/users.module.js';

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
  });
`,
    );

    const result = generateFeature('orders', { cwd });

    expect(result.featureName).toBe('orders');
    expect(result.registered).toBe(true);
    expect(existsSync(join(cwd, 'features', 'orders', 'orders.module.ts'))).toBe(
      true,
    );
    expect(existsSync(join(cwd, 'features', 'orders', 'orders.test.ts'))).toBe(
      true,
    );

    const appSource = readFileSync(join(cwd, 'src', 'app.ts'), 'utf8');
    expect(appSource).toContain(
      `import { OrdersModule } from '../features/orders/orders.module.js';`,
    );
    expect(appSource).toContain('modules: [UsersModule, OrdersModule]');
  });

  it('supports generating without auto registration', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(
      join(cwd, 'src', 'app.ts'),
      `import { createApp } from './core/http/app.js';

export const buildApp = () =>
  createApp({
    modules: [],
  });
`,
    );

    const result = generateFeature('billing-items', {
      cwd,
      register: false,
    });

    expect(result.registered).toBe(false);
    const appSource = readFileSync(join(cwd, 'src', 'app.ts'), 'utf8');
    expect(appSource).not.toContain('BillingItemsModule');
  });

  it('supports minimal feature template', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());

    const result = generateFeature('catalog', {
      cwd,
      template: 'minimal',
    });

    expect(result.template).toBe('minimal');
    expect(existsSync(join(cwd, 'features', 'catalog', 'catalog.module.ts'))).toBe(true);
    expect(existsSync(join(cwd, 'features', 'catalog', 'catalog.service.ts'))).toBe(true);
    expect(existsSync(join(cwd, 'features', 'catalog', 'catalog.repository.ts'))).toBe(
      false,
    );
    expect(existsSync(join(cwd, 'features', 'catalog', 'catalog.errors.ts'))).toBe(
      false,
    );
    expect(existsSync(join(cwd, 'features', 'catalog', 'catalog.test.ts'))).toBe(false);
  });

  it('registers a module import only once', () => {
    const source = `import { createApp } from './core/http/app.js';
import { UsersModule } from '../features/users/users.module.js';

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
  });
`;

    const once = registerModuleInApp(source, 'orders', 'Orders');
    const twice = registerModuleInApp(once, 'orders', 'Orders');

    expect(twice.match(/OrdersModule/g)?.length).toBe(2);
    expect(twice).toContain('modules: [UsersModule, OrdersModule]');
  });

  it('generates a service and repository inside an existing feature', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });

    const service = generateService('users', 'sync-profile', { cwd });
    const repository = generateRepository('users', 'audit-log', { cwd });

    expect(existsSync(service.filePath)).toBe(true);
    expect(existsSync(repository.filePath)).toBe(true);
    expect(service.registered).toBe(true);
    expect(repository.registered).toBe(true);
    expect(readFileSync(service.filePath, 'utf8')).toContain('export class SyncProfileService');
    expect(readFileSync(repository.filePath, 'utf8')).toContain(
      'export class InMemoryAuditLogRepository',
    );

    const moduleSource = readFileSync(
      join(cwd, 'features', 'users', 'users.module.ts'),
      'utf8',
    );

    expect(moduleSource).toContain(
      `import { SyncProfileService } from './sync-profile.service.js';`,
    );
    expect(moduleSource).toContain(
      `import { AUDIT_LOG_REPOSITORY, InMemoryAuditLogRepository } from './audit-log.repository.js';`,
    );
    expect(moduleSource).toContain('SyncProfileService');
    expect(moduleSource).toContain(
      '{ provide: AUDIT_LOG_REPOSITORY, useClass: InMemoryAuditLogRepository }',
    );
  });

  it('generates a controller and registers it in the feature module', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });

    const controller = generateController('users', 'admin-panel', { cwd });

    expect(existsSync(controller.filePath)).toBe(true);
    expect(controller.registered).toBe(true);
    expect(readFileSync(controller.filePath, 'utf8')).toContain(
      'export class AdminPanelController',
    );

    const moduleSource = readFileSync(
      join(cwd, 'features', 'users', 'users.module.ts'),
      'utf8',
    );
    expect(moduleSource).toContain(
      `import { AdminPanelController } from './admin-panel.controller.js';`,
    );
    expect(moduleSource).toContain('AdminPanelController');
  });

  it('adds a schema export into the feature schemas file', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });

    const schema = generateSchema('users', 'admin-filter', { cwd });

    expect(schema.exportName).toBe('adminFilterSchema');
    const schemasSource = readFileSync(
      join(cwd, 'features', 'users', 'users.schemas.ts'),
      'utf8',
    );
    expect(schemasSource).toContain('export const adminFilterSchema =');
    expect(schemasSource).toContain('z.object({');
  });

  it('adds a route into an existing feature files', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });

    const result = generateRoute('users', 'admin-list', {
      cwd,
      method: 'GET',
      path: '/admin/list',
    });

    expect(result.routePath).toBe('/admin/list');

    const routesSource = readFileSync(
      join(cwd, 'features', 'users', 'users.routes.ts'),
      'utf8',
    );
    const controllerSource = readFileSync(
      join(cwd, 'features', 'users', 'users.controller.ts'),
      'utf8',
    );
    const schemasSource = readFileSync(
      join(cwd, 'features', 'users', 'users.schemas.ts'),
      'utf8',
    );

    expect(routesSource).toContain("router.get('/admin/list'");
    expect(routesSource).toContain('adminListRouteSchema');
    expect(controllerSource).toContain('getAdminList = async');
    expect(schemasSource).toContain('export const adminListRouteSchema');
  });

  it('adds a route with a dedicated controller and named schema', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });

    const result = generateRoute('users', 'export-report', {
      cwd,
      method: 'POST',
      path: '/reports/export',
      controller: 'report-admin',
      schema: 'report-export',
    });

    expect(result.controllerName).toBe('report-admin');
    expect(result.schemaName).toBe('reportExportSchema');

    const routeSource = readFileSync(
      join(cwd, 'features', 'users', 'users.routes.ts'),
      'utf8',
    );
    const controllerSource = readFileSync(
      join(cwd, 'features', 'users', 'report-admin.controller.ts'),
      'utf8',
    );
    const schemaSource = readFileSync(
      join(cwd, 'features', 'users', 'users.schemas.ts'),
      'utf8',
    );
    const moduleSource = readFileSync(
      join(cwd, 'features', 'users', 'users.module.ts'),
      'utf8',
    );

    expect(routeSource).toContain(
      `import { ReportAdminController } from './report-admin.controller.js';`,
    );
    expect(routeSource).toContain('schema: reportExportSchema');
    expect(routeSource).toContain("router.post('/reports/export'");
    expect(controllerSource).toContain('postExportReport = async');
    expect(schemaSource).toContain('export const reportExportSchema =');
    expect(moduleSource).toContain('ReportAdminController');
  });

  it('registers module providers only once', () => {
    const source = `import { defineModule } from '../../core/http/module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
});
`;

    const once = registerProviderInModule(
      source,
      './sync-profile.service.js',
      ['SyncProfileService'],
      ['SyncProfileService'],
    );
    const twice = registerProviderInModule(
      once,
      './sync-profile.service.js',
      ['SyncProfileService'],
      ['SyncProfileService'],
    );

    expect(twice).toContain(
      `import { SyncProfileService } from './sync-profile.service.js';`,
    );
    expect(twice.match(/SyncProfileService/g)?.length).toBe(2);
  });

  it('generates a CRUD resource with controller, service, repository, schemas and routes', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });

    const result = generateCrudResource('users', 'profile-card', {
      cwd,
      basePath: '/profiles',
    });

    expect(result.basePath).toBe('/profiles');
    expect(existsSync(join(cwd, 'features', 'users', 'profile-card.controller.ts'))).toBe(
      true,
    );
    expect(existsSync(join(cwd, 'features', 'users', 'profile-card.service.ts'))).toBe(
      true,
    );
    expect(existsSync(join(cwd, 'features', 'users', 'profile-card.repository.ts'))).toBe(
      true,
    );
    expect(existsSync(result.testPath)).toBe(true);

    const routesSource = readFileSync(
      join(cwd, 'features', 'users', 'users.routes.ts'),
      'utf8',
    );
    const controllerSource = readFileSync(
      join(cwd, 'features', 'users', 'profile-card.controller.ts'),
      'utf8',
    );
    const schemasSource = readFileSync(
      join(cwd, 'features', 'users', 'users.schemas.ts'),
      'utf8',
    );
    const errorsSource = readFileSync(
      join(cwd, 'features', 'users', 'users.errors.ts'),
      'utf8',
    );
    const moduleSource = readFileSync(
      join(cwd, 'features', 'users', 'users.module.ts'),
      'utf8',
    );

    expect(routesSource).toContain("router.get('/profiles'");
    expect(routesSource).toContain("router.get('/profiles/:id'");
    expect(routesSource).toContain("router.post('/profiles'");
    expect(routesSource).toContain("router.patch('/profiles/:id'");
    expect(routesSource).toContain("router.delete('/profiles/:id'");
    expect(controllerSource).toContain('getListProfileCard = async');
    expect(controllerSource).toContain('postCreateProfileCard = async');
    expect(controllerSource).toContain('deleteDeleteProfileCard = async');
    expect(controllerSource).toContain('ProfileCardService');
    expect(errorsSource).toContain('export class ProfileCardNotFoundError');
    expect(schemasSource).toContain('export const listProfileCardSchema =');
    expect(schemasSource).toContain('export const updateProfileCardSchema =');
    expect(schemasSource).toContain('export const deleteProfileCardSchema =');
    expect(moduleSource).toContain('ProfileCardController');
    expect(moduleSource).toContain('ProfileCardService');
    expect(moduleSource).toContain('PROFILE_CARD_REPOSITORY');
    expect(readFileSync(result.testPath, 'utf8')).toContain("method: 'GET'");
    expect(readFileSync(result.testPath, 'utf8')).toContain("method: 'PATCH'");
    expect(readFileSync(result.service.filePath, 'utf8')).toContain('throw new ProfileCardNotFoundError()');
    expect(readFileSync(result.testPath, 'utf8')).toContain("method: 'DELETE'");
  });

  it('removes a generated CRUD resource and cleans key references', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });
    generateCrudResource('users', 'profile-card', {
      cwd,
      basePath: '/profiles',
    });

    const result = removeCrudResource('users', 'profile-card', {
      cwd,
      basePath: '/profiles',
    });

    expect(result.removed).toBe(true);
    expect(
      existsSync(join(cwd, 'features', 'users', 'profile-card.controller.ts')),
    ).toBe(false);
    expect(
      existsSync(join(cwd, 'features', 'users', 'profile-card.service.ts')),
    ).toBe(false);
    expect(
      existsSync(join(cwd, 'features', 'users', 'profile-card.repository.ts')),
    ).toBe(false);
    expect(
      existsSync(join(cwd, 'features', 'users', 'profile-card.test.ts')),
    ).toBe(false);

    const routesSource = readFileSync(
      join(cwd, 'features', 'users', 'users.routes.ts'),
      'utf8',
    );
    const moduleSource = readFileSync(
      join(cwd, 'features', 'users', 'users.module.ts'),
      'utf8',
    );
    const schemasSource = readFileSync(
      join(cwd, 'features', 'users', 'users.schemas.ts'),
      'utf8',
    );
    const typesSource = readFileSync(
      join(cwd, 'features', 'users', 'users.types.ts'),
      'utf8',
    );
    const errorsSource = readFileSync(
      join(cwd, 'features', 'users', 'users.errors.ts'),
      'utf8',
    );

    expect(routesSource).not.toContain('/profiles');
    expect(moduleSource).not.toContain('ProfileCardController');
    expect(moduleSource).not.toContain('ProfileCardService');
    expect(moduleSource).not.toContain('PROFILE_CARD_REPOSITORY');
    expect(schemasSource).not.toContain('ProfileCardSchema');
    expect(typesSource).not.toContain('ProfileCard');
    expect(errorsSource).not.toContain('ProfileCardNotFoundError');
  });

  it('removes a generated route and cleans controller/schema references', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    generateFeature('users', { cwd });
    generateRoute('users', 'export-report', {
      cwd,
      method: 'POST',
      path: '/reports/export',
      controller: 'report-admin',
      schema: 'report-export',
    });

    const result = removeRoute('users', 'export-report', {
      cwd,
      method: 'POST',
      path: '/reports/export',
      controller: 'report-admin',
      schema: 'report-export',
    });

    expect(result.removed).toBe(true);

    const routeSource = readFileSync(
      join(cwd, 'features', 'users', 'users.routes.ts'),
      'utf8',
    );
    const controllerSource = readFileSync(
      join(cwd, 'features', 'users', 'report-admin.controller.ts'),
      'utf8',
    );
    const schemaSource = readFileSync(
      join(cwd, 'features', 'users', 'users.schemas.ts'),
      'utf8',
    );

    expect(routeSource).not.toContain('/reports/export');
    expect(routeSource).not.toContain('reportExportSchema');
    expect(controllerSource).not.toContain('postExportReport = async');
    expect(schemaSource).not.toContain('export const reportExportSchema =');
  });
});

const createWorkspace = () => {
  const dir = mkdtempSync(join(tmpdir(), 'v12-cli-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'src'), { recursive: true });
  return dir;
};

const baseAppSource = () => `import { createApp } from './core/http/app.js';

export const buildApp = () =>
  createApp({
    modules: [],
  });
`;

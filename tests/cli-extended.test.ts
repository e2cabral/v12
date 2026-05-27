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
  generateFeature,
  removeFeature,
  generateMiddleware,
  generateGuard,
  generateMail,
  unregisterModuleFromApp,
} from '../src/cli/scaffold.js';

const tempDirs: string[] = [];

describe('v12 cli extended scaffolding', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0, tempDirs.length)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  const createWorkspace = () => {
    const dir = mkdtempSync(join(tmpdir(), 'v12-cli-ext-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'src'), { recursive: true });
    return dir;
  };

  const baseAppSource = () => `import { createApp } from './core/http/app.js';
import { UsersModule } from '../features/users/users.module.js';

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
  });
`;

  it('removes a feature and unregisters it from app.ts', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    writeFileSync(join(cwd, 'src', 'app.ts'), baseAppSource());
    
    generateFeature('orders', { cwd });
    expect(existsSync(join(cwd, 'features', 'orders'))).toBe(true);
    
    const result = removeFeature('orders', { cwd });
    expect(result.featureName).toBe('orders');
    expect(result.unregistered).toBe(true);
    expect(existsSync(join(cwd, 'features', 'orders'))).toBe(false);

    const appSource = readFileSync(join(cwd, 'src', 'app.ts'), 'utf8');
    expect(appSource).not.toContain('OrdersModule');
    expect(appSource).toContain('modules: [UsersModule]');
  });

  it('generates a middleware', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    generateFeature('users', { cwd });

    const result = generateMiddleware('users', 'logger', { cwd });
    expect(existsSync(result.middlewareFile)).toBe(true);
    expect(readFileSync(result.middlewareFile, 'utf8')).toContain('export const loggerMiddleware = async');
  });

  it('generates a guard', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    generateFeature('users', { cwd });

    const result = generateGuard('users', 'is-admin', { cwd });
    expect(existsSync(result.guardFile)).toBe(true);
    expect(readFileSync(result.guardFile, 'utf8')).toContain('export const isAdminGuard = (): RouteMiddleware =>');
  });

  it('generates a mail template', () => {
    const cwd = createWorkspace();
    mkdirSync(join(cwd, 'features'), { recursive: true });
    generateFeature('users', { cwd });

    const result = generateMail('users', 'welcome', { cwd });
    expect(existsSync(result.mailFile)).toBe(true);
    expect(readFileSync(result.mailFile, 'utf8')).toContain('export class WelcomeMail extends Mailable');
  });

  it('unregisters module from app source correctly', () => {
    const source = `import { createApp } from './core/http/app.js';
import { UsersModule } from '../features/users/users.module.js';
import { OrdersModule } from '../features/orders/orders.module.js';

export const buildApp = () =>
  createApp({
    modules: [UsersModule, OrdersModule],
  });
`;
    const result = unregisterModuleFromApp(source, 'orders', 'Orders');
    expect(result).not.toContain('OrdersModule');
    expect(result).toContain('modules: [UsersModule]');
    expect(result).not.toContain("import { OrdersModule }");
  });
});

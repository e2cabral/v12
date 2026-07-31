import { describe, expect, it } from 'vitest';
import { Container } from '../src/core/container/container.js';

describe('Container error messages with dependency chain', () => {
  describe('missing provider with resolution path', () => {
    it('shows the resolution path when a nested dependency is missing', () => {
      const LOGGER_TOKEN = 'Logger';
      class UsersService {
        static inject = [LOGGER_TOKEN] as const;
        constructor(public logger: any) {}
      }
      class UsersController {
        static inject = [UsersService] as const;
        constructor(public service: any) {}
      }

      const container = new Container();
      container.register(UsersController);
      container.register(UsersService);
      // Logger token is NOT registered

      expect(() => container.resolve(UsersController)).toThrowError(
        /Cannot resolve "Logger".*Resolution path:.*UsersController.*UsersService.*Logger.*No provider registered/,
      );
    });

    it('shows token name for string tokens', () => {
      const TOKEN = 'DatabaseConnection';
      class Repository {
        static inject = [TOKEN] as const;
        constructor(public db: any) {}
      }

      const container = new Container();
      container.register(Repository);

      expect(() => container.resolve(Repository)).toThrowError(
        /Cannot resolve "DatabaseConnection".*Resolution path:.*Repository.*DatabaseConnection.*No provider registered/,
      );
    });

    it('shows token name for symbol tokens', () => {
      const TOKEN = Symbol('Config');
      class Service {
        static inject = [TOKEN] as const;
        constructor(public config: any) {}
      }

      const container = new Container();
      container.register(Service);

      expect(() => container.resolve(Service)).toThrowError(
        /Cannot resolve "Symbol\(Config\)".*Resolution path:.*Service.*Symbol\(Config\).*No provider registered/,
      );
    });
  });

  describe('circular dependency detection', () => {
    it('detects direct circular dependency (A → B → A)', () => {
      class ServiceA {
        static inject: any[];
        constructor(public b: any) {}
      }
      class ServiceB {
        static inject: any[];
        constructor(public a: any) {}
      }
      ServiceA.inject = [ServiceB];
      ServiceB.inject = [ServiceA];

      const container = new Container();
      container.register(ServiceA);
      container.register(ServiceB);

      expect(() => container.resolve(ServiceA)).toThrowError(
        /Circular dependency detected:.*ServiceA.*ServiceB.*ServiceA/,
      );
    });

    it('detects deep circular dependency (A → B → C → A)', () => {
      class ServiceA {
        static inject: any[];
        constructor(public b: any) {}
      }
      class ServiceB {
        static inject: any[];
        constructor(public c: any) {}
      }
      class ServiceC {
        static inject: any[];
        constructor(public a: any) {}
      }
      ServiceA.inject = [ServiceB];
      ServiceB.inject = [ServiceC];
      ServiceC.inject = [ServiceA];

      const container = new Container();
      container.register(ServiceA);
      container.register(ServiceB);
      container.register(ServiceC);

      expect(() => container.resolve(ServiceA)).toThrowError(
        /Circular dependency detected:.*ServiceA.*ServiceB.*ServiceC.*ServiceA/,
      );
    });

    it('shows the full path with arrow notation', () => {
      class AuthService {
        static inject: any[];
        constructor(public dep: any) {}
      }
      class UsersService {
        static inject: any[];
        constructor(public dep: any) {}
      }
      AuthService.inject = [UsersService];
      UsersService.inject = [AuthService];

      const container = new Container();
      container.register(AuthService);
      container.register(UsersService);

      expect(() => container.resolve(AuthService)).toThrowError(
        'Circular dependency detected: AuthService \u2192 UsersService \u2192 AuthService',
      );
    });
  });

  describe('has() method', () => {
    it('returns true for registered class providers', () => {
      class MyService {}
      const container = new Container();
      container.register(MyService);

      expect(container.has(MyService)).toBe(true);
    });

    it('returns true for registered value providers', () => {
      const TOKEN = 'config';
      const container = new Container();
      container.register({ provide: TOKEN, useValue: { port: 3000 } });

      expect(container.has(TOKEN)).toBe(true);
    });

    it('returns true for registered factory providers', () => {
      const TOKEN = Symbol('factory');
      const container = new Container();
      container.register({ provide: TOKEN, useFactory: () => 'value' });

      expect(container.has(TOKEN)).toBe(true);
    });

    it('returns false for unregistered tokens', () => {
      class UnknownService {}
      const container = new Container();

      expect(container.has(UnknownService)).toBe(false);
    });

    it('returns false for unregistered string tokens', () => {
      const container = new Container();

      expect(container.has('nonexistent')).toBe(false);
    });

    it('returns false for unregistered symbol tokens', () => {
      const container = new Container();

      expect(container.has(Symbol('nope'))).toBe(false);
    });

    it('checks parent container', () => {
      class ParentService {}
      const parent = new Container();
      parent.register(ParentService);

      const child = parent.createChild();

      expect(child.has(ParentService)).toBe(true);
    });

    it('returns false when token is not in parent either', () => {
      class MissingService {}
      const parent = new Container();
      const child = parent.createChild();

      expect(child.has(MissingService)).toBe(false);
    });
  });

  describe('existing behavior still works', () => {
    it('resolves registered class providers', () => {
      class Logger {}
      const container = new Container();
      container.register(Logger);

      const instance = container.resolve(Logger);
      expect(instance).toBeInstanceOf(Logger);
    });

    it('resolves with dependencies via inject', () => {
      class Logger {}
      class Service {
        static inject = [Logger] as const;
        constructor(public logger: Logger) {}
      }

      const container = new Container();
      container.register(Logger);
      container.register(Service);

      const instance = container.resolve(Service);
      expect(instance).toBeInstanceOf(Service);
      expect(instance.logger).toBeInstanceOf(Logger);
    });

    it('resolves value providers', () => {
      const TOKEN = 'config';
      const config = { port: 3000 };
      const container = new Container();
      container.register({ provide: TOKEN, useValue: config });

      expect(container.resolve(TOKEN)).toBe(config);
    });

    it('resolves factory providers', () => {
      const TOKEN = Symbol('factory');
      const container = new Container();
      container.register({
        provide: TOKEN,
        useFactory: () => ({ created: true }),
      });

      const result = container.resolve(TOKEN) as { created: boolean };
      expect(result.created).toBe(true);
    });

    it('respects singleton scope', () => {
      class Service {}
      const container = new Container();
      container.register(Service);

      const a = container.resolve(Service);
      const b = container.resolve(Service);
      expect(a).toBe(b);
    });

    it('resolves from parent container', () => {
      class ParentService {}
      const parent = new Container();
      parent.register(ParentService);

      const child = parent.createChild();
      const instance = child.resolve(ParentService);
      expect(instance).toBeInstanceOf(ParentService);
    });

    it('resolves unregistered classes by auto-instantiating', () => {
      class SimpleClass {}
      const container = new Container();

      const instance = container.resolve(SimpleClass);
      expect(instance).toBeInstanceOf(SimpleClass);
    });
  });
});

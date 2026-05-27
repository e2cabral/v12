import { Container, type Provider } from '../../container/container.js';
import { EventBus } from '../../events/event-bus.js';
import { I18nService, type I18nOptions } from '../../i18n/i18n.js';
import { AuditService } from '../../audit/audit-service.js';
import type { ModuleDefinition } from '../module.js';

export type ContainerFactoryOptions = {
  modules: ModuleDefinition[];
  providers: Provider[];
  logger: any;
  i18nOptions?: I18nOptions;
  redis?: any;
};

export function initContainer({
  modules,
  providers,
  logger,
  i18nOptions,
  redis,
}: ContainerFactoryOptions) {
  const container = new Container();
  const events = new EventBus();
  const i18nService = new I18nService(i18nOptions || { defaultLocale: 'en' });
  const auditService = new AuditService(logger);

  // Carregar traduções dos módulos
  for (const module of modules) {
    if (module.i18n) {
      for (const [locale, translations] of Object.entries(module.i18n)) {
        i18nService.addTranslations(locale, translations);
      }
    }
  }

  container.registerMany([
    { provide: 'Logger', useValue: logger },
    { provide: 'EventBus', useValue: events },
    { provide: 'I18nService', useValue: i18nService },
    { provide: 'AuditService', useValue: auditService },
    ...(redis ? [{ provide: 'Redis', useValue: redis }] : []),
    ...providers,
    ...modules.flatMap((module) => module.providers ?? []),
  ]);

  return {
    container,
    events,
    i18nService,
    auditService,
  };
}

# defineModule

`defineModule()` descreve uma feature do `v12`: nome, rotas, providers, middlewares, eventos e outros recursos anexos.

## Assinatura

```ts
defineModule(definition: ModuleDefinition): ModuleDefinition
```

## Campos do modulo

- `name`: nome da feature e prefixo padrao das rotas
- `prefix`: sobrescreve o prefixo padrao
- `routes`: rotas construidas com `createRouter()`
- `providers`: classes, tokens e valores registrados no container
- `middlewares`: middlewares executados antes dos handlers da feature
- `events`: listeners registrados no `EventBus`
- `jobs`: definicoes de jobs
- `i18n`: traducoes locais da feature

## Exemplo minimo

```ts
export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: buildUsersRoutes(),
});
```

## Exemplo com providers, eventos e i18n

```ts
import { defineModule } from 'v12';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { BILLING_REPOSITORY, BillingRepository } from './billing.repository.js';
import { buildBillingRoutes } from './billing.routes.js';

export const BillingModule = defineModule({
  name: 'billing',
  prefix: '/v1/billing',
  providers: [
    { provide: BILLING_REPOSITORY, useClass: BillingRepository },
    BillingService,
    BillingController,
  ],
  routes: buildBillingRoutes(),
  middlewares: [
    async ({ request }) => {
      request.headers['x-feature'] = 'billing';
    },
  ],
  events: [
    {
      event: 'invoice.paid',
      handler: async (payload) => {
        console.log('invoice paid', payload);
      },
    },
  ],
  i18n: {
    en: {
      billing: {
        paid: 'Invoice paid successfully',
      },
    },
    pt: {
      billing: {
        paid: 'Fatura paga com sucesso',
      },
    },
  },
});
```

## Boas praticas

- um modulo por dominio de negocio
- providers internos da feature devem morar perto dela
- mantenha controllers finos e regras em services
- use `prefix` apenas quando a URL precisar fugir do padrao `/${name}`

## O que acontece no runtime

- o modulo e lido no bootstrap do `createApp()`
- seus providers sao registrados no container
- suas traducoes sao anexadas ao `I18nService`
- seus listeners entram no `EventBus`
- suas rotas recebem o prefixo calculado pelo framework

## Links relacionados

- [Modules](/concepts/modules)
- [createRouter](/api/create-router)
- [createApp](/api/create-app)
- [CLI](/api/cli)

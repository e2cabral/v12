# defineModule

`defineModule()` descreve uma feature do V12. Ele funciona como o ponto de montagem do domínio: nome, prefixo, providers, rotas, middlewares, eventos, jobs e i18n local.

## Assinatura

```ts
defineModule(definition: ModuleDefinition): ModuleDefinition
```

## Exemplo mínimo

```ts
import { defineModule } from '@eddiecbrl/v12';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { usersRoutes } from './users.routes.js';

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: usersRoutes,
});
```

## Campos disponíveis

### `name`

Nome da feature. Também é usado como prefixo padrão das rotas.

```ts
name: 'users'
```

Sem `prefix` explícito, a base do módulo será `'/users'`.

### `prefix`

Sobrescreve o prefixo padrão.

```ts
prefix: '/api/v1/users'
```

Use isso quando a URL pública precisar fugir do padrão `/${name}`.

### `routes`

Recebe o resultado de `createRouter().build()`.

```ts
routes: usersRoutes
```

### `providers`

Lista de providers registrados no container.

Aceita:

- classes
- `{ provide, useClass }`
- `{ provide, useValue }`
- `{ provide, useFactory }`

Exemplo:

```ts
const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

providers: [
  { provide: USERS_REPOSITORY, useClass: UsersRepository },
  UsersService,
  UsersController,
]
```

### `middlewares`

Middlewares executados em todas as rotas da feature.

```ts
middlewares: [
  async ({ request }) => {
    request.headers['x-feature'] = 'users';
  },
]
```

### `events`

Handlers registrados automaticamente no `EventBus`.

```ts
events: [
  {
    event: 'user.created',
    handler: async (payload) => {
      console.log('new user', payload);
    },
  },
]
```

Cada item também pode receber configuração de retry:

```ts
events: [
  {
    event: 'invoice.paid',
    handler: InvoicePaidHandler,
    resilience: {
      retry: {
        attempts: 3,
      },
    },
  },
]
```

### `jobs`

Define jobs de background ligados ao módulo.

### `i18n`

Mescla traduções locais da feature ao serviço global de i18n.

```ts
i18n: {
  'pt-BR': {
    users: {
      created: 'Usuário criado com sucesso',
    },
  },
}
```

## Exemplo mais completo

```ts
import { defineModule } from '@eddiecbrl/v12';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { BILLING_REPOSITORY, BillingRepository } from './billing.repository.js';
import { billingRoutes } from './billing.routes.js';

export const BillingModule = defineModule({
  name: 'billing',
  prefix: '/v1/billing',
  providers: [
    { provide: BILLING_REPOSITORY, useClass: BillingRepository },
    BillingService,
    BillingController,
  ],
  routes: billingRoutes,
  middlewares: [
    async ({ request }) => {
      request.headers['x-domain'] = 'billing';
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
    'pt-BR': {
      billing: {
        paid: 'Fatura paga com sucesso',
      },
    },
  },
});
```

## O que acontece no runtime

Quando `createApp()` processa um módulo:

1. registra os providers no container global
2. conecta traduções locais ao i18n
3. registra handlers de eventos
4. calcula o prefixo final das rotas
5. anexa middlewares da feature ao pipeline de request

## Como pensar os limites de um módulo

Uma boa pergunta prática é: "essa regra pertence a qual domínio?".

Se a resposta for clara, normalmente esse domínio merece o próprio módulo.

### Bons sinais

- regras e entidades giram em torno do mesmo problema de negócio
- as rotas da feature compartilham dependências
- existe vocabulário próprio do domínio

### Maus sinais

- feature com dependências demais de outras features
- módulo virando pasta genérica de utilidades
- controllers contendo regra de negócio demais

## Exemplo de organização sugerida

```txt
src/features/users/
  users.module.ts
  users.routes.ts
  users.controller.ts
  users.service.ts
  users.schemas.ts
  users.repository.ts
```

## Links relacionados

- [createRouter](/api/create-router)
- [createApp](/api/create-app)
- [Modules](/concepts/modules)
- [Containers](/concepts/containers)

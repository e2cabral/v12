# createApp

`createApp()` cria a instância principal do V12. É ele que monta o runtime Fastify, inicializa o container, registra hooks globais, conecta módulos e ativa plugins.

## Assinatura

```ts
createApp(options?: CreateAppOptions): Promise<AppInstance>
```

## Quando usar

Use `createApp()` no bootstrap da aplicação, normalmente em `src/app.ts`.

Um arranjo comum é:

- `src/app.ts`: compõe módulos, plugins e opções do runtime
- `src/server.ts`: chama `buildApp()` e faz `listen()`

## Exemplo mínimo

```ts
import { createApp } from '@eddiecbrl/v12';
import { UsersModule } from './features/users/users.module.js';

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
  });
```

## Exemplo com segurança, plugin e provider global

```ts
import { createApp, pluginOpenApi } from '@eddiecbrl/v12';
import { UsersModule } from './features/users/users.module.js';

class Clock {
  now() {
    return new Date();
  }
}

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
    providers: [
      { provide: 'Clock', useClass: Clock },
    ],
    security: {
      cors: true,
      helmet: true,
      bodyLimit: 1024 * 1024,
      requestTimeout: 10_000,
    },
    plugins: [
      pluginOpenApi({
        title: 'Users API',
        version: '1.0.0',
      }),
    ],
  });
```

## Exemplo com Redis, upload e WebSocket

```ts
const app = await createApp({
  modules: [UsersModule],
  redis: { url: 'redis://localhost:6379' },
  upload: true,
  websocket: true,
});
```

## Parâmetros

### `modules`

Lista de módulos definidos com `defineModule()`.

```ts
modules: [UsersModule, BillingModule]
```

Cada módulo contribui com rotas, providers, middlewares, eventos, jobs e traduções.

### `providers`

Providers globais disponíveis para toda a aplicação.

Aceita:

- classes
- `{ provide, useClass }`
- `{ provide, useValue }`
- `{ provide, useFactory }`

Exemplos:

```ts
providers: [
  LoggerService,
  { provide: 'APP_NAME', useValue: 'My API' },
  { provide: 'Clock', useClass: Clock },
  {
    provide: 'NOW',
    useFactory: () => () => new Date(),
  },
]
```

### `middlewares`

Middlewares globais executados antes dos middlewares de módulo e das rotas.

```ts
middlewares: [
  async ({ request, reply }) => {
    if (!request.headers['x-api-version']) {
      reply.code(400).send({
        success: false,
        error: {
          code: 'MISSING_API_VERSION',
          message: 'x-api-version header is required',
        },
      });
    }
  },
]
```

### `plugins`

Plugins V12 registrados com `app.use()`. Um dos mais comuns é `pluginOpenApi()`.

```ts
plugins: [
  pluginOpenApi({
    title: 'My API',
    version: '1.0.0',
  }),
]
```

### `fastify`

Opções repassadas para a instância Fastify.

Exemplo:

```ts
fastify: {
  logger: true,
}
```

### `security`

Ativa e configura recursos de segurança.

Campos disponíveis:

- `cors`
- `helmet`
- `bodyLimit`
- `requestTimeout`
- `cookie`

Exemplo:

```ts
security: {
  cors: { origin: true },
  helmet: true,
  cookie: true,
  bodyLimit: 1024 * 1024,
  requestTimeout: 15_000,
}
```

### `redis`

Registra `@fastify/redis` e disponibiliza o cliente para recursos que o utilizam.

```ts
redis: { url: 'redis://localhost:6379' }
```

Também pode ser `true`, caso em que o framework usa `redis://localhost:6379`.

### `upload`

Ativa `@fastify/multipart`.

```ts
upload: true
```

ou com configuração:

```ts
upload: {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}
```

### `websocket`

Ativa `@fastify/websocket`.

```ts
websocket: true
```

### `i18n`

Configura locale padrão e traduções globais.

### `telemetry`

Inicializa OpenTelemetry no bootstrap.

## Retorno

`AppInstance` estende a instância do Fastify com:

- `container`
- `events`
- `modules`
- `telemetry`
- `use(plugin)`

## O que o framework registra automaticamente

Ao criar a aplicação, o V12 expõe:

- `GET /`
- `GET /health`
- `GET /metrics`
- `GET /_v12/devtools`

Quando `pluginOpenApi()` é usado, também ficam disponíveis:

- `GET /openapi.json`
- `GET /docs`

## Ordem geral do bootstrap

1. cria a instância Fastify
2. inicia telemetria, se habilitada
3. registra recursos de segurança
4. registra Redis, multipart e WebSocket, se configurados
5. cria container, EventBus e i18n
6. instala hooks globais, `x-request-id`, tratamento de erro e devtools
7. registra plugins
8. registra eventos e rotas dos módulos

## Como os prefixos funcionam

Para cada rota, o caminho final é composto por:

1. `module.prefix`, se existir; senão `/${module.name}`
2. `router.prefix`, se existir
3. `route.path`

Exemplo:

```ts
defineModule({
  name: 'users',
  prefix: '/api/users',
  routes: createRouter('/admin').build(),
})
```

Uma rota `'/summary'` vira:

```txt
/api/users/admin/summary
```

## Observações importantes

- providers passados em `modules` são registrados no container automaticamente
- middlewares globais executam antes dos middlewares de módulo e de rota
- erros de validação são convertidos para resposta padronizada
- o framework adiciona e devolve `x-request-id` nos responses

## Dicas de uso

- prefira encapsular `createApp()` em `buildApp()`
- mantenha `server.ts` fino
- registre plugins no bootstrap, não em rotas
- use providers globais para dependências realmente transversais

## Links relacionados

- [defineModule](/api/define-module)
- [createRouter](/api/create-router)
- [Swagger/OpenAPI](/api/swagger)
- [Bootstrap](/architecture/bootstrap)

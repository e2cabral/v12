# createApp

`createApp()` cria a instancia principal do framework, registra recursos globais e conecta os modulos da aplicacao ao runtime HTTP.

## Assinatura

```ts
createApp(options?: CreateAppOptions): Promise<AppInstance>
```

## Quando usar

Use `createApp()` no bootstrap da aplicacao, normalmente em `src/app.ts` ou `src/server.ts`.

## Parametros principais

- `modules`: lista de modulos definidos com `defineModule()`
- `providers`: providers globais disponiveis para todos os modulos
- `middlewares`: middlewares executados em todas as rotas
- `plugins`: plugins do ecossistema V12
- `fastify`: opcoes repassadas para a instancia Fastify
- `security`: habilita `cors`, `helmet`, cookie e limites da aplicacao
- `redis`: registra o plugin Redis e injeta o cliente como provider
- `upload`: habilita multipart upload
- `websocket`: habilita websocket routes
- `i18n`: define locale padrao e traducoes
- `telemetry`: inicia OpenTelemetry no bootstrap

## Retorno

`AppInstance`, que estende a instancia Fastify com:

- `container`
- `events`
- `modules`
- `telemetry`
- `use(plugin)`

## Exemplo minimo

```ts
import { createApp } from 'v12';
import { UsersModule } from './features/users/users.module.js';

const app = await createApp({
  modules: [UsersModule],
});

await app.listen({ port: 3000 });
```

## Exemplo com seguranca e providers globais

```ts
import { createApp } from 'v12';
import { UsersModule } from './features/users/users.module.js';
import { BillingModule } from './features/billing/billing.module.js';
import { Clock } from './shared/clock.js';

const app = await createApp({
  modules: [UsersModule, BillingModule],
  providers: [
    { provide: 'Clock', useClass: Clock },
  ],
  security: {
    cors: { origin: true },
    helmet: true,
    bodyLimit: 1024 * 1024,
  },
});
```

## Exemplo com middleware global

```ts
const app = await createApp({
  modules: [UsersModule],
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
  ],
});
```

## Como o bootstrap funciona

1. cria a instancia Fastify
2. registra recursos globais como `cors`, `helmet`, `cookie`, `redis`, `multipart` e websocket
3. monta o container e registra providers globais e dos modulos
4. adiciona hooks como `x-request-id`, `/health` e `/metrics`
5. registra plugins e rotas dos modulos

## Notas importantes

- o prefixo de rota do modulo e montado a partir de `module.prefix` ou `/${module.name}`
- providers declarados em `modules` entram automaticamente no container
- middlewares globais executam antes dos middlewares do modulo e da rota
- se `telemetry.enabled` for verdadeiro, o runtime inicia e para junto com a app

## Performance

O custo principal esta no bootstrap. O objetivo e deixar o request path leve.

## Compatibilidade

- Node.js `20+`
- Fastify `5+`

## Migracao

Reserve uma camada `buildApp()` para isolar mudancas futuras.

## Links relacionados

- [Bootstrap](/architecture/bootstrap)
- [Quick Start](/introduction/quick-start)
- [defineModule](/api/define-module)

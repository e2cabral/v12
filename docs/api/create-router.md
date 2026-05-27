# createRouter

`createRouter()` cria a definição de rotas de uma feature. Ele organiza paths, handlers, validação, middlewares de rota, WebSocket e políticas de resiliência.

## Assinatura

```ts
createRouter(prefix?: string)
```

## O que ele retorna

O retorno é um builder com:

- `get(path, definition)`
- `post(path, definition)`
- `put(path, definition)`
- `patch(path, definition)`
- `delete(path, definition)`
- `build()`

## Exemplo mínimo

```ts
import { createRouter } from '@eddiecbrl/v12';
import { UsersController } from './users.controller.js';

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(UsersController).list(),
});

export const usersRoutes = router.build();
```

## Atenção: não encadeie os métodos

No estado atual da API, os métodos como `router.get()` e `router.post()` não foram desenhados para chain fluente.

Então prefira isto:

```ts
const router = createRouter();

router.get('/', { handler });
router.post('/', { handler });

export const routes = router.build();
```

e não:

```ts
// Evite este formato
createRouter().get('/', { handler }).post('/', { handler });
```

## Definição de rota

Cada rota aceita:

- `handler`
- `schema`
- `middlewares`
- `version`
- `websocket`
- `resilience`

## `handler`

É a função principal da rota.

```ts
handler: ({ container }) => container.resolve(UsersController).list()
```

Ela recebe um `RequestContext`.

## `RequestContext`

O contexto contém:

- `request`
- `reply`
- `container`
- `t(key, args)`
- `connection` em rotas WebSocket
- `signal` quando timeout/resiliência injeta cancelamento

Exemplo:

```ts
handler: async ({ request, container, t }) => {
  const service = container.resolve(UsersService);
  const result = await service.create(request.body);
  return {
    message: t('users.created'),
    result,
  };
}
```

## `schema`

Aceita validadores Zod para:

- `body`
- `params`
- `querystring`
- `headers`

Exemplo:

```ts
import { z } from 'zod';

const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};
```

Uso:

```ts
router.post('/', {
  schema: createUserSchema,
  handler: ({ request, container }) =>
    container.resolve(UsersController).create({
      request: { body: request.body as z.infer<typeof createUserSchema.body> },
    }),
});
```

## `middlewares`

Middlewares executados antes do handler da rota.

```ts
router.delete('/:id', {
  middlewares: [
    async ({ request }) => {
      if (!request.headers.authorization) {
        throw new Error('Unauthorized');
      }
    },
  ],
  handler: ({ container }) => container.resolve(UsersController).remove(),
});
```

## `version`

Permite anexar metadados de versão à rota.

```ts
version: 'v1'
```

## `websocket`

Marca a rota como endpoint WebSocket.

```ts
router.get('/stream', {
  websocket: true,
  handler: async ({ connection }) => {
    connection.socket.send('connected');
  },
});
```

Para que isso funcione, a aplicação precisa ser criada com:

```ts
createApp({
  websocket: true,
})
```

## `resilience`

Permite compor retry, circuit breaker, bulkhead, timeout e fallback.

```ts
router.get('/external-profile/:id', {
  resilience: {
    retry: { attempts: 3, delay: 100 },
    timeout: { ms: 2_000 },
    fallback: {
      handler: () => ({ cached: false, unavailable: true }),
    },
  },
  handler: ({ request }) => fetchProfile(String((request.params as any).id)),
});
```

## Prefixo local do router

Você pode passar um prefixo ao criar o router:

```ts
const router = createRouter('/admin');
```

Se o módulo também tiver prefixo, os valores são combinados.

Exemplo:

```ts
const router = createRouter('/admin');

router.get('/summary', { handler });

defineModule({
  name: 'users',
  prefix: '/api/users',
  routes: router.build(),
});
```

O path final será:

```txt
/api/users/admin/summary
```

## Fluxo de execução da rota

1. o framework monta o `RequestContext`
2. valida `body`, `params`, `querystring` e `headers` quando há `schema`
3. executa middlewares globais
4. executa middlewares do módulo
5. executa middlewares da rota
6. aplica pipeline de resiliência, se houver
7. executa o handler e serializa a resposta com o envelope padrão

## Boas práticas

- mantenha o handler curto e delegue regra para services
- use Zod em tudo que cruza a borda HTTP
- agrupe schemas da feature no mesmo módulo de domínio
- use middlewares de rota para checks pontuais e middlewares de módulo para política transversal

## Links relacionados

- [defineModule](/api/define-module)
- [createApp](/api/create-app)
- [Validation](/api/validation)
- [Request Pipeline](/architecture/request-pipeline)

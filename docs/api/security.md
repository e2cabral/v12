# Security API

O V12 oferece guards e opções de segurança no `createApp()` para proteger rotas, trabalhar com autenticação e limitar tráfego.

## Guards disponíveis

- `auth()`
- `jwt(options)`
- `apiKey(options)`
- `role(expectedRoles)`
- `policy(handler)`

Todos são middlewares de rota.

## `auth()`

Verifica apenas se existe header `Authorization`.

```ts
import { auth } from '@eddiecbrl/v12';

router.get('/private', {
  middlewares: [auth()],
  handler: () => ({ message: 'Acesso permitido' }),
});
```

Use quando você só quer garantir a presença de autenticação na borda e delegar a validação completa para outro ponto.

## `jwt(options)`

Valida um JWT e anexa o payload em `request.auth`.

```ts
import { jwt } from '@eddiecbrl/v12';

router.get('/me', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
  ],
  handler: ({ request }) => ({
    user: (request as any).auth,
  }),
});
```

Se `cookieName` for informado, a guard tenta primeiro ler do cookie; se não encontrar, cai para `Authorization: Bearer ...`.

```ts
jwt({
  secret: process.env.JWT_SECRET!,
  cookieName: 'sid',
})
```

Para isso funcionar com cookies, a app precisa ter:

```ts
createApp({
  security: {
    cookie: true,
  },
})
```

## `apiKey(options)`

Protege a rota usando uma API key comparada com `timingSafeEqual`.

```ts
import { apiKey } from '@eddiecbrl/v12';

router.post('/webhook', {
  middlewares: [
    apiKey({
      key: process.env.WEBHOOK_SECRET!,
      headerName: 'X-Webhook-Token',
    }),
  ],
  handler: () => ({ ok: true }),
});
```

## `role(expectedRoles)`

Verifica se a role atual é compatível.

Ela lê:

1. `request.auth.role`, quando `jwt()` já rodou
2. `x-role`, como fallback

```ts
import { jwt, role } from '@eddiecbrl/v12';

router.post('/settings', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
    role(['admin', 'super-user']),
  ],
  handler: () => ({ saved: true }),
});
```

## `policy(handler)`

Permite autorização customizada.

```ts
import { jwt, policy } from '@eddiecbrl/v12';

const canEditPost = policy(async ({ request, container }) => {
  const posts = container.resolve(PostsService);
  const post = await posts.findById((request.params as any).id);
  return post.authorId === (request as any).auth?.sub;
});

router.patch('/posts/:id', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
    canEditPost,
  ],
  handler: () => ({ updated: true }),
});
```

## Plugin de rate limit

O projeto expõe `pluginRateLimit()` sobre `@fastify/rate-limit`.

```ts
import { createApp, pluginRateLimit } from '@eddiecbrl/v12';

const app = await createApp({
  plugins: [
    pluginRateLimit({
      max: 100,
      timeWindow: '1 minute',
    }),
  ],
});
```

O plugin já aplica defaults:

- `max: 100`
- `timeWindow: '1 minute'`

## Segurança em `createApp()`

O objeto `security` aceita:

- `cors`
- `helmet`
- `bodyLimit`
- `requestTimeout`
- `cookie`

Exemplo:

```ts
const app = await createApp({
  security: {
    cors: true,
    helmet: true,
    cookie: true,
    bodyLimit: 1024 * 1024,
    requestTimeout: 10_000,
  },
});
```

## Padrões úteis

### Rota autenticada simples

```ts
middlewares: [jwt({ secret: process.env.JWT_SECRET! })]
```

### Admin

```ts
middlewares: [
  jwt({ secret: process.env.JWT_SECRET! }),
  role('admin'),
]
```

### Integração interna

```ts
middlewares: [apiKey({ key: process.env.INTERNAL_API_KEY! })]
```

### Regra contextual

```ts
middlewares: [jwt({ secret }), policy(async () => true)]
```

## Links relacionados

- [Auth API](/api/auth)
- [Guia de Autenticação](/guides/authentication)
- [Guia de Segurança](/security/)

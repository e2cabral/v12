# Security API

O V12 fornece middlewares e plugins para proteger suas rotas, gerenciando autenticação, autorização e controle de tráfego.

## Guards

Os guards são middlewares que protegem o acesso às rotas. Eles podem ser importados de `v12`.

### auth

Verifica apenas se o header `Authorization` está presente.

```ts
import { auth } from 'v12';

router.get('/private', {
  middlewares: [auth()],
  handler: () => ({ message: 'Acesso permitido' })
});
```

### jwt

Verifica e decodifica um token JWT (do header Bearer ou Cookie). O payload decodificado é anexado ao objeto `request.auth`.

```ts
import { jwt } from 'v12';

router.get('/me', {
  middlewares: [jwt({ secret: 'seu-segredo' })],
  handler: ({ request }) => ({ user: request.auth })
});
```

### apiKey

Protege a rota usando uma API Key.

```ts
import { apiKey } from 'v12';

router.get('/webhook', {
  middlewares: [apiKey({ key: 'sua-chave', headerName: 'x-api-key' })],
  handler: () => ({ status: 'success' })
});
```

### role

Verifica se o usuário possui a role necessária. Funciona em conjunto com o middleware `jwt` ou lendo o header `x-role`.

```ts
import { jwt, role } from 'v12';

router.post('/settings', {
  middlewares: [
    jwt({ secret: 'seu-segredo' }),
    role(['admin', 'super-user'])
  ],
  handler: () => ({ saved: true })
});
```

### policy

Permite definir regras de autorização customizadas e complexas.

```ts
import { jwt, policy } from 'v12';

const canEditPost = policy(async ({ request, container }) => {
  const posts = container.resolve(PostsService);
  const post = await posts.findById(request.params.id);
  return post.authorId === request.auth.sub;
});

router.patch('/posts/:id', {
  middlewares: [jwt({ secret: 'secret' }), canEditPost],
  handler: () => ({ updated: true })
});
```

## Plugins de Segurança

### Rate Limit

O V12 integra o `@fastify/rate-limit` para limitar a taxa de requisições. Deve ser registrado no `createApp`.

```ts
import { createApp, pluginRateLimit } from 'v12';

const app = await createApp({
  plugins: [
    pluginRateLimit({
      max: 100,
      timeWindow: '1 minute'
    })
  ]
});
```

## Security Options (createApp)

Através do parâmetro `security` no `createApp`, você pode habilitar recursos globais:

- `cors`: Habilita o plugin CORS.
- `helmet`: Habilita o plugin Helmet para segurança de headers.
- `cookie`: Habilita o suporte a cookies assinados.
- `bodyLimit`: Define o tamanho máximo do body da requisição.
- `requestTimeout`: Define o timeout global das requisições.

## Links relacionados

- [Auth API](/api/auth)
- [Guia de Segurança](/security/)

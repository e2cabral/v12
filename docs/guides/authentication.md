# Autenticação

Este guia mostra os fluxos mais comuns de autenticação no V12 usando JWT, cookies, role-based access e API key.

## O cenário mais comum

Na maioria das APIs V12, o fluxo fica assim:

1. login valida usuário e gera tokens
2. token volta no body ou em cookie httpOnly
3. rotas protegidas usam middleware `jwt(...)`
4. rotas sensíveis podem adicionar `role(...)` e `apiKey(...)`

## 1. Criando o `AuthService`

```ts
import { AuthService } from '@eddiecbrl/v12';

export const authService = new AuthService({
  secret: process.env.JWT_SECRET!,
  expiresInSeconds: 3600,
  refreshTokenExpiresInSeconds: 60 * 60 * 24,
  cookieName: 'sid',
});
```

## 2. Implementando login

```ts
class AuthController {
  static inject = [UsersService] as const;

  constructor(private readonly users: UsersService) {}

  login = async ({ request, reply }: any) => {
    const user = await this.users.validate(request.body.email, request.body.password);

    const auth = new AuthService({
      secret: process.env.JWT_SECRET!,
      expiresInSeconds: 3600,
      refreshTokenExpiresInSeconds: 86400,
      cookieName: 'sid',
    });

    const tokens = auth.generateTokens({
      sub: user.id,
      role: user.role,
    });

    auth.setSession(reply, tokens);

    return {
      user: {
        id: user.id,
        role: user.role,
      },
      tokens,
    };
  };
}
```

## 3. Protegendo rota com JWT

```ts
import { createRouter, jwt } from '@eddiecbrl/v12';

const router = createRouter();

router.get('/profile', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
  ],
  handler: ({ request }) => {
    return {
      auth: (request as any).auth,
    };
  },
});
```

Depois da guard, o payload validado fica em `request.auth`.

## 4. Lendo JWT por cookie

Se você quiser usar cookie httpOnly:

```ts
jwt({
  secret: process.env.JWT_SECRET!,
  cookieName: 'sid',
})
```

Nesse caso, a guard tenta:

1. cookie `sid`
2. se não existir, `Authorization: Bearer ...`

Para isso, a app precisa ter cookies habilitados:

```ts
createApp({
  security: {
    cookie: true,
  },
})
```

## 5. Controle por role

```ts
import { jwt, role } from '@eddiecbrl/v12';

router.post('/admin/settings', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
    role('admin'),
  ],
  handler: async () => ({ ok: true }),
});
```

Também aceita múltiplas roles:

```ts
role(['admin', 'manager'])
```

## 6. Proteção por API key

Boa para integrações internas, webhooks e M2M.

```ts
import { apiKey } from '@eddiecbrl/v12';

router.post('/webhooks/payment', {
  middlewares: [
    apiKey({
      key: process.env.WEBHOOK_SECRET!,
      headerName: 'X-Webhook-Token',
    }),
  ],
  handler: async () => ({ received: true }),
});
```

## 7. Combinando tudo

```ts
import { apiKey, createRouter, jwt, role } from '@eddiecbrl/v12';

const router = createRouter();

router.get('/internal-admin-report', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
    role('admin'),
    apiKey({ key: process.env.INTERNAL_API_KEY! }),
  ],
  handler: ({ request }) => ({
    sub: (request as any).auth?.sub,
  }),
});
```

## 8. Refresh token

Se você usou `refreshTokenExpiresInSeconds`, o `AuthService` também gera refresh token.

```ts
const auth = new AuthService({
  secret: process.env.JWT_SECRET!,
  expiresInSeconds: 900,
  refreshTokenExpiresInSeconds: 86400,
  cookieName: 'sid',
});

const accessToken = auth.refresh(refreshToken);
```

## Boas práticas

- deixe o secret fora do código
- mantenha access token curto
- use refresh token para renovação
- prefira cookie httpOnly em aplicações web
- use API key para contextos servidor-servidor
- mantenha regra de autenticação na borda HTTP, não no service de domínio

## Links relacionados

- [Auth API](/api/auth)
- [Security API](/api/security)
- [JWT Cookbook](/cookbook/jwt-auth)

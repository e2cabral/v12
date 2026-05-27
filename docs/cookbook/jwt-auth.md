# Autenticação JWT Completa

Este cookbook mostra um fluxo prático de login, emissão de tokens e proteção de rotas com JWT no V12.

## 1. Criando o serviço de autenticação

```ts
import { AuthService } from '@eddiecbrl/v12';

export const authService = new AuthService({
  secret: process.env.JWT_SECRET!,
  expiresInSeconds: 60 * 15,
  refreshTokenExpiresInSeconds: 60 * 60 * 24,
  cookieName: 'sid',
});
```

## 2. Login

```ts
import { AppError } from '@eddiecbrl/v12';

class LoginService {
  static inject = [UsersRepository] as const;

  constructor(private readonly repository: UsersRepository) {}

  async execute(input: { email: string; password: string }) {
    const user = await this.repository.findByEmail(input.email);

    if (!user || user.password !== input.password) {
      throw new AppError('Invalid credentials', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    return authService.generateTokens({
      sub: user.id,
      role: user.role,
    });
  }
}
```

## 3. Rota de login

```ts
router.post('/login', {
  handler: async ({ request, reply, container }) => {
    const tokens = await container.resolve(LoginService).execute(
      request.body as { email: string; password: string },
    );

    authService.setSession(reply, tokens);

    return tokens;
  },
});
```

## 4. Protegendo rotas

### Qualquer usuário autenticado

```ts
import { jwt } from '@eddiecbrl/v12';

router.get('/profile', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
  ],
  handler: ({ request }) => ({
    auth: (request as any).auth,
  }),
});
```

### Apenas admin

```ts
import { jwt, role } from '@eddiecbrl/v12';

router.get('/admin/stats', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET! }),
    role('admin'),
  ],
  handler: async () => ({ stats: 'ok' }),
});
```

## 5. Usando cookie httpOnly

Se quiser autenticar por cookie:

```ts
const app = await createApp({
  security: {
    cookie: true,
  },
  modules: [AuthModule],
});
```

E nas rotas protegidas:

```ts
jwt({
  secret: process.env.JWT_SECRET!,
  cookieName: 'sid',
})
```

## 6. Refresh token

```ts
router.post('/refresh', {
  handler: async ({ request }) => {
    const refreshToken = (request as any).cookies?.sid_refresh;
    const accessToken = authService.refresh(refreshToken);
    return { accessToken };
  },
});
```

## 7. Fluxo recomendado

1. login valida credenciais
2. `AuthService` gera access + refresh token
3. cookies httpOnly são escritos com `setSession`
4. rotas usam `jwt(...)`
5. acesso sensível pode usar `role(...)`

## Dicas

- mantenha o access token curto
- use HTTPS em produção
- nunca coloque dados sensíveis no payload do JWT
- prefira cookie httpOnly em apps web

## Links relacionados

- [Auth API](/api/auth)
- [Security API](/api/security)
- [Guia de Autenticação](/guides/authentication)

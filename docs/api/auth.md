# Auth API

O V12 oferece utilitários para JWT, API key, OAuth e gerenciamento simples de sessão por cookie.

## O que existe hoje

- `signJwt()`
- `verifyJwt()`
- `extractBearerToken()`
- `signTokens()`
- `AuthService`
- `verifyApiKey()`
- `OAuthService`
- `GenericOAuthProvider`
- presets para Google, GitHub, Microsoft, Apple e LinkedIn

## JWT

## `signJwt(payload, options)`

Gera um token JWT assinado com HMAC SHA-256.

```ts
import { signJwt } from '@eddiecbrl/v12';

const token = signJwt(
  { sub: 'user-1', role: 'admin' },
  {
    secret: 'super-secret',
    expiresInSeconds: 3600,
  },
);
```

### Opções

- `secret`
- `expiresInSeconds`
- `refreshTokenExpiresInSeconds`
- `cookieName`

## `verifyJwt(token, options)`

Valida assinatura e expiração.

```ts
import { verifyJwt } from '@eddiecbrl/v12';

const payload = verifyJwt(token, {
  secret: 'super-secret',
});
```

Se falhar, lança `UnauthorizedError`.

## `extractBearerToken(header)`

Extrai o token de `Authorization: Bearer <token>`.

```ts
import { extractBearerToken } from '@eddiecbrl/v12';

const token = extractBearerToken('Bearer abc.def.ghi');
```

## `signTokens(payload, options)`

Gera par de tokens.

```ts
import { signTokens } from '@eddiecbrl/v12';

const tokens = signTokens(
  { sub: 'user-1' },
  {
    secret: 'super-secret',
    expiresInSeconds: 900,
    refreshTokenExpiresInSeconds: 60 * 60 * 24,
  },
);
```

Retorno:

```ts
{
  accessToken: string;
  refreshToken?: string;
}
```

## `AuthService`

Encapsula geração de tokens, refresh e manipulação de cookies de sessão.

## Exemplo

```ts
import { AuthService } from '@eddiecbrl/v12';

const authService = new AuthService({
  secret: 'super-secret',
  expiresInSeconds: 3600,
  refreshTokenExpiresInSeconds: 86400,
  cookieName: 'sid',
});

const tokens = authService.generateTokens({
  sub: 'user-1',
  role: 'admin',
});
```

## `generateTokens(payload)`

Retorna `{ accessToken, refreshToken? }`.

## `refresh(refreshToken)`

Valida o refresh token e gera novo access token.

```ts
const newAccessToken = authService.refresh(refreshToken);
```

## `setSession(reply, tokens)`

Define cookies httpOnly com base em `cookieName`.

```ts
authService.setSession(reply, tokens);
```

Se houver `refreshToken`, ele será salvo em `${cookieName}_refresh`.

## `clearSession(reply)`

Remove os cookies da sessão.

```ts
authService.clearSession(reply);
```

## Exemplo de login

```ts
class AuthController {
  static inject = [AuthService, UsersService] as const;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  login = async ({ request, reply }: any) => {
    const user = await this.users.validate(request.body.email, request.body.password);

    const tokens = this.auth.generateTokens({
      sub: user.id,
      role: user.role,
    });

    this.auth.setSession(reply, tokens);

    return tokens;
  };
}
```

## API key

## `verifyApiKey(headers, options)`

Compara a chave recebida com a chave esperada usando `timingSafeEqual`.

```ts
import { verifyApiKey } from '@eddiecbrl/v12';

verifyApiKey(
  {
    'x-api-key': 'internal-key',
  },
  {
    key: 'internal-key',
  },
);
```

Você também pode mudar o nome do header:

```ts
verifyApiKey(headers, {
  key: 'webhook-secret',
  headerName: 'X-Webhook-Token',
});
```

## OAuth

O V12 expõe:

- `OAuthService`
- `GenericOAuthProvider`
- presets de configuração

## Exemplo com Google

```ts
import {
  GenericOAuthProvider,
  GoogleOAuthPreset,
  OAuthService,
} from '@eddiecbrl/v12';

const oauth = new OAuthService();

oauth.registerProvider(
  new GenericOAuthProvider(
    'google',
    GoogleOAuthPreset({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: 'http://localhost:3000/auth/callback/google',
    }),
  ),
);
```

## Fluxo básico OAuth

### 1. Gerar URL de autorização

```ts
const provider = oauth.getProvider('google');
const url = provider.getAuthUrl('my-state');
```

### 2. Trocar `code` por tokens

```ts
const tokens = await provider.getTokens(code);
```

### 3. Buscar perfil do usuário

```ts
const profile = await provider.getUserInfo(tokens.accessToken);
```

## Presets disponíveis

- `GoogleOAuthPreset`
- `GitHubOAuthPreset`
- `MicrosoftOAuthPreset`
- `AppleOAuthPreset`
- `LinkedInOAuthPreset`

## Como isso se conecta às guards

As guards de autenticação vivem em [Security API](/api/security), mas esta é a ligação prática:

- `jwt(options)` usa `verifyJwt()`
- `apiKey(options)` usa `verifyApiKey()`
- `role(...)` lê `request.auth.role`

## Exemplo de rota protegida

```ts
import { createRouter, jwt, role, apiKey } from '@eddiecbrl/v12';

const router = createRouter();

router.get('/private', {
  middlewares: [
    jwt({ secret: 'super-secret' }),
    role('admin'),
    apiKey({ key: 'internal-key' }),
  ],
  handler: ({ request }) => ({
    subject: (request as any).auth?.sub,
  }),
});
```

## Cookies e JWT

Se `jwt({ secret, cookieName: 'access_token' })` for usado, a guard tenta primeiro ler o token do cookie com esse nome; se não encontrar, cai para o header `Authorization`.

## Boas práticas

- use segredo vindo de variável de ambiente
- mantenha access tokens curtos
- reserve refresh token para renovação e não para autorização direta
- prefira cookie httpOnly em apps web
- use API key para M2M, webhooks e integrações internas

## Links relacionados

- [Guia de Autenticação](/guides/authentication)
- [Security API](/api/security)
- [Cookbook JWT](/cookbook/jwt-auth)

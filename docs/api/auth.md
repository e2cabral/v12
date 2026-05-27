# Auth API

O `v12` oferece utilitários para autenticação baseada em JWT e chaves de API (API Key), facilitando a gestão de tokens e sessões.

## JWT

### signJwt

Gera um token JWT assinado com HS256.

```ts
import { signJwt } from 'v12';

const token = signJwt({ sub: 'user-id', role: 'admin' }, {
  secret: 'seu-segredo',
  expiresInSeconds: 3600
});
```

### verifyJwt

Verifica e decodifica um token JWT. Lança `UnauthorizedError` se inválido ou expirado.

```ts
import { verifyJwt } from 'v12';

const payload = verifyJwt(token, { secret: 'seu-segredo' });
```

### AuthService

Classe de serviço que abstrai a gestão de tokens e cookies de sessão.

```ts
import { AuthService } from 'v12';

const authService = new AuthService({
  secret: 'seu-segredo',
  expiresInSeconds: 3600,
  refreshTokenExpiresInSeconds: 86400,
  cookieName: 'v12_session'
});

// Gera access e refresh tokens
const tokens = authService.generateTokens({ sub: 'user-id' });

// Define cookies na resposta
authService.setSession(reply, tokens);
```

## OAuth

O V12 oferece um `OAuthService` com presets para os principais provedores (Google, GitHub, Microsoft, Apple, LinkedIn).

### Configurando Provedores

```ts
import { OAuthService, GenericOAuthProvider, GoogleOAuthPreset } from 'v12';

const oauth = new OAuthService();
oauth.registerProvider(new GenericOAuthProvider('google', GoogleOAuthPreset({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback/google'
})));
```

### Fluxo de Autenticação

```ts
// 1. Redirecionar para o provedor
const url = oauth.getProvider('google').getAuthUrl();
reply.redirect(url);

// 2. No callback, trocar o code pelos tokens
const { code } = request.query;
const provider = oauth.getProvider('google');
const tokens = await provider.getTokens(code);
const userInfo = await provider.getUserInfo(tokens.accessToken);
```

## API Key

### verifyApiKey

Compara uma API Key recebida nos headers com uma chave esperada de forma segura (timing-safe).

```ts
import { verifyApiKey } from 'v12';

verifyApiKey(request.headers, {
  key: 'sua-chave-mestra',
  headerName: 'X-API-Key' // Opcional, padrão é x-api-key
});
```

## Utilitários

- `extractBearerToken(header)`: Extrai o token de um header `Authorization: Bearer <token>`.
- `signTokens(payload, options)`: Gera par de tokens (access e refresh).

## Links relacionados

- [Guia de Autenticação](/guides/authentication)
- [Security API](/api/security)

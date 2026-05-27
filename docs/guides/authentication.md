# Autenticação



A autenticação no V12 é projetada para ser simples e desacoplada da sua lógica de negócio. Este guia mostra como implementar fluxos comuns de segurança.

## Autenticação via JWT

O fluxo mais comum envolve receber um token no header `Authorization` e decodificá-lo para identificar o usuário.

### 1. Configurando o AuthService

Primeiro, registre o `AuthService` como um provider no seu módulo ou globalmente no `createApp`.

```ts
import { AuthService } from 'v12';

const authService = new AuthService({
  secret: process.env.JWT_SECRET,
  expiresInSeconds: 3600,
  cookieName: 'session_token'
});
```

### 2. Criando o fluxo de Login

No seu controller, use o `AuthService` para gerar os tokens.

```ts
class AuthController {
  static inject = [AuthService, UsersService] as const;
  constructor(private auth: AuthService, private users: UsersService) {}

  login = async ({ request, reply }) => {
    const user = await this.users.validate(request.body.email, request.body.password);
    
    const tokens = this.auth.generateTokens({ sub: user.id, role: user.role });
    
    // Opcional: define cookie httpOnly
    this.auth.setSession(reply, tokens);

    return tokens;
  }
}
```

### 3. Protegendo Rotas

Use o middleware `jwt` para proteger suas rotas. Ele automaticamente verifica o token e anexa o payload em `request.auth`.

```ts
import { jwt, role } from 'v12';

router.get('/profile', {
  middlewares: [jwt({ secret: process.env.JWT_SECRET })],
  handler: ({ request }) => {
    return { user: request.auth };
  }
});
```

## Controle de Acesso (RBAC)

Você pode restringir o acesso a rotas específicas baseando-se em funções (roles).

```ts
router.post('/admin/settings', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET }),
    role('admin')
  ],
  handler: () => ({ status: 'admin access granted' })
});
```

## Autenticação via API Key

Útil para integrações entre serviços (M2M).

```ts
import { apiKey } from 'v12';

router.post('/webhooks/payment', {
  middlewares: [
    apiKey({ key: process.env.WEBHOOK_SECRET, headerName: 'X-Webhook-Token' })
  ],
  handler: () => ({ received: true })
});
```

## Boas Práticas

- **Segredos**: Nunca deixe secrets no código. Use `process.env`.
- **HttpOnly Cookies**: Para aplicações web, prefira cookies `httpOnly` para mitigar ataques XSS. O `AuthService` facilita isso com o método `setSession`.
- **Desacoplamento**: Seus serviços de domínio não devem saber nada sobre headers ou tokens. Receba apenas o `userId` ou `userObject` já resolvido.

## Links relacionados

- [Auth API Reference](/api/auth)
- [Security API Reference](/api/security)

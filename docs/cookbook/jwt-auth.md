# Autenticação JWT Completa

Este guia mostra como implementar um fluxo de login e proteção de rotas usando JWT (JSON Web Token) no V12.

## 1. Fluxo de Login

O login consiste em validar as credenciais do usuário e gerar um token.

### O Service de Auth

```ts
import { BusinessError, AuthService, Inject } from 'v12';
import { UsersRepository } from '../repositories/users.repository.js';

export class LoginService {
  constructor(
    private repository: UsersRepository,
    private auth: AuthService
  ) {}

  async execute({ email, password }) {
    const user = await this.repository.findByEmail(email);
    
    // Em um app real, use bcrypt para comparar senhas!
    if (!user || user.password !== password) {
      throw new BusinessError('Credenciais inválidas', 401);
    }

    // Gera o token JWT
    const token = await this.auth.generateToken({ 
      id: user.id, 
      email: user.email,
      roles: user.roles 
    });

    return { token, user };
  }
}
```

### A Rota de Login

```ts
router.post('/login', {
  handler: async ({ request, container }) => {
    const service = container.resolve(LoginService);
    return service.execute(request.body);
  }
});
```

## 2. Protegendo Rotas

Para proteger uma rota, você deve usar o Guard de autenticação (`jwt`).

### Proteção Simples (Qualquer usuário logado)

```ts
import { jwt } from 'v12';

router.get('/profile', {
  middlewares: [jwt({ secret: process.env.JWT_SECRET })],
  handler: async ({ request }) => {
    // O usuário autenticado fica disponível no request.auth
    return request.auth;
  }
});
```

### Proteção por Role (Apenas Admin)

```ts
import { jwt, role } from 'v12';

router.get('/admin/stats', {
  middlewares: [
    jwt({ secret: process.env.JWT_SECRET }),
    role('admin')
  ],
  handler: async () => {
    return { stats: '...' };
  }
});
```

## 3. Configuração do JWT

Não esqueça de configurar o segredo do JWT no `createApp`.

```ts
const app = await createApp({
  auth: {
    jwt: {
      secret: getEnv('JWT_SECRET'),
      expiresIn: '1d'
    }
  },
  // ...
});
```

## 4. Onde guardar o Token?

-   **Frontend**: O recomendado é guardar o token em um **Cookie HttpOnly** para evitar ataques XSS, ou no `localStorage` se você implementar outras proteções.
-   **Headers**: O V12 espera o token no header `Authorization: Bearer <token>` por padrão.

## Dicas de Segurança

1.  **Use HTTPS**: Nunca envie tokens JWT sobre conexões não criptografadas.
2.  **Segredo Forte**: Use uma string longa e aleatória para o seu `JWT_SECRET`.
3.  **Expiração Curta**: Mantenha o tempo de expiração do token o mais curto possível (ex: 15 minutos) e use Refresh Tokens para manter o usuário logado.
4.  **Não guarde dados sensíveis**: O payload do JWT é visível por qualquer pessoa. Nunca coloque senhas ou dados bancários dentro dele.

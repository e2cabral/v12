# Quick Start

Suba uma aplicacao funcional com o `v12` em poucos minutos e entenda o fluxo minimo do framework.

## O que voce vai montar

Ao final desta pagina voce tera:

- uma app criada com `createApp()`
- uma feature `users` registrada como modulo
- duas rotas funcionando: `GET /users` e `POST /users`
- endpoints operacionais como `/health` e `/metrics`

## 1. Instale as dependencias

```bash
npm install
```

## 2. Monte uma feature simples

Crie uma estrutura como esta:

```txt
src/
  server.ts
  features/
    users/
      users.module.ts
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.schemas.ts
```

### `src/features/users/users.schemas.ts`

```ts
import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};
```

### `src/features/users/users.service.ts`

```ts
import crypto from 'node:crypto';

type User = {
  id: string;
  name: string;
  email: string;
};

export class UsersService {
  private readonly users: User[] = [];

  list() {
    return this.users;
  }

  create(input: Omit<User, 'id'>) {
    const user = { id: crypto.randomUUID(), ...input };
    this.users.push(user);
    return user;
  }
}
```

### `src/features/users/users.controller.ts`

```ts
import type { RequestContext } from 'v12';
import { UsersService } from './users.service.js';

export class UsersController {
  static inject = [UsersService] as const;

  constructor(private readonly usersService: UsersService) {}

  list = async () => this.usersService.list();

  create = async ({ request }: RequestContext) =>
    this.usersService.create(request.body as { name: string; email: string });
}
```

### `src/features/users/users.routes.ts`

```ts
import { createRouter } from 'v12';
import { UsersController } from './users.controller.js';
import { createUserSchema } from './users.schemas.js';

export const buildUsersRoutes = () => {
  const router = createRouter();

  router.get('/', {
    handler: ({ container }) => container.resolve(UsersController).list(),
  });

  router.post('/', {
    schema: createUserSchema,
    handler: (context) => context.container.resolve(UsersController).create(context),
  });

  return router.build();
};
```

### `src/features/users/users.module.ts`

```ts
import { defineModule } from 'v12';
import { UsersController } from './users.controller.js';
import { buildUsersRoutes } from './users.routes.js';
import { UsersService } from './users.service.js';

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: buildUsersRoutes(),
});
```

## 3. Suba a aplicacao

### `src/server.ts`

```ts
import { createApp } from 'v12';
import { UsersModule } from './features/users/users.module.js';

const app = await createApp({
  modules: [UsersModule],
  security: {
    cors: true,
    helmet: true,
  },
});

await app.listen({ port: 3000 });
```

Agora rode:

```bash
npm run dev
```

## 4. Teste o fluxo

```bash
curl http://localhost:3000/health
```

```bash
curl http://localhost:3000/users
```

```bash
curl -X POST http://localhost:3000/users ^
  -H "content-type: application/json" ^
  -d "{\"name\":\"Ada Lovelace\",\"email\":\"ada@example.com\"}"
```

Resposta esperada:

```json
{
  "success": true,
  "data": {
    "id": "generated-id",
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

## 5. Quando usar a CLI

Se voce preferir gerar a estrutura automaticamente:

```bash
npm run v12 -- generate feature users
```

Para um CRUD mais completo:

```bash
npm run v12 -- generate resource users profile-card --path /profiles
```

## Proximos passos

- adicionar persistencia em [Banco de dados](/guides/database)
- proteger rotas em [Autenticacao](/guides/authentication)
- validar comportamento com [Testes](/guides/testing)

## Links relacionados

- [Instalacao](/introduction/installation)
- [Primeira aplicacao](/guides/first-application)
- [CLI](/api/cli)

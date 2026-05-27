# Primeira Aplicacao

Monte uma aplicacao pequena, mas com estrutura de projeto proxima do que voce usaria em producao.

## Objetivo

Nesta pagina vamos separar responsabilidades em:

- `module` para descrever a feature
- `router` para declarar rotas
- `controller` para falar HTTP
- `service` para concentrar regra de negocio

## Estrutura sugerida

```txt
src/
  app.ts
  server.ts
  features/
    users/
      users.module.ts
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.schemas.ts
```

## 1. Comece pela regra de negocio

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

  listUsers() {
    return this.users;
  }

  createUser(input: Omit<User, 'id'>) {
    const user = {
      id: crypto.randomUUID(),
      ...input,
    };

    this.users.push(user);
    return user;
  }
}
```

Aqui ainda nao existe nada de HTTP. Isso facilita testes e reaproveitamento.

## 2. Defina os contratos da rota

### `src/features/users/users.schemas.ts`

```ts
import { z } from 'zod';

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

export const getUserSchema = {
  params: z.object({
    id: z.string().min(1),
  }),
};
```

## 3. Crie o controller

### `src/features/users/users.controller.ts`

```ts
import type { RequestContext } from 'v12';
import { UsersService } from './users.service.js';

export class UsersController {
  static inject = [UsersService] as const;

  constructor(private readonly usersService: UsersService) {}

  list = async () => this.usersService.listUsers();

  create = async ({ request }: RequestContext) =>
    this.usersService.createUser(request.body as { name: string; email: string });
}
```

O `static inject` indica ao container quais dependencias precisam ser resolvidas.

## 4. Monte o router da feature

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

## 5. Registre o modulo

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

O nome do modulo vira prefixo por padrao. Com `name: 'users'`, as rotas ficam em `/users`.

## 6. Bootstrap da app

### `src/app.ts`

```ts
import { createApp } from 'v12';
import { UsersModule } from './features/users/users.module.js';

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
    security: {
      cors: true,
      helmet: true,
    },
  });
```

### `src/server.ts`

```ts
import { buildApp } from './app.js';

const app = await buildApp();

await app.listen({ port: 3000 });
```

## 7. Exercite os endpoints

```bash
curl http://localhost:3000/users
```

```bash
curl -X POST http://localhost:3000/users ^
  -H "content-type: application/json" ^
  -d "{\"name\":\"Grace Hopper\",\"email\":\"grace@example.com\"}"
```

## O que voce acabou de usar

- `createApp()` para criar a instancia principal
- `defineModule()` para descrever a feature
- `createRouter()` para declarar as rotas
- `RequestContext` para acessar `request`, `reply`, `container` e traducao

## Problemas comuns

- esquecer de adicionar o modulo em `modules: [UsersModule]`
- misturar imports sem extensao `.js` em ambiente ESM
- acoplar regra de negocio direto no handler da rota cedo demais

## Links relacionados

- [Quick Start](/introduction/quick-start)
- [createApp](/api/create-app)
- [defineModule](/api/define-module)
- [createRouter](/api/create-router)

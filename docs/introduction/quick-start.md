# Quick Start

Se você quer sair do zero para uma API rodando com o menor número de arquivos possível, comece aqui.

## Objetivo

Ao final deste guia você terá:

- uma aplicação V12 rodando em `http://localhost:3000`
- uma feature `users`
- validação com Zod
- rotas `GET /users` e `POST /users`

## 1. Instale as dependências

```bash
npm install @eddiecbrl/v12 zod
```

## 2. Crie `src/app.ts`

```ts
import crypto from 'node:crypto';
import { z } from 'zod';
import { createApp, createRouter, defineModule } from '@eddiecbrl/v12';

const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

type CreateUserInput = z.infer<typeof createUserSchema.body>;

class UsersService {
  private readonly users: Array<{ id: string; name: string; email: string }> = [];

  list() {
    return this.users;
  }

  create(input: CreateUserInput) {
    const user = { id: crypto.randomUUID(), ...input };
    this.users.push(user);
    return user;
  }
}

class UsersController {
  static inject = [UsersService] as const;

  constructor(private readonly usersService: UsersService) {}

  list = async () => this.usersService.list();

  create = async ({ request }: { request: { body: CreateUserInput } }) =>
    this.usersService.create(request.body);
}

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(UsersController).list(),
});

router.post('/', {
  schema: createUserSchema,
  handler: ({ container, request }) =>
    container.resolve(UsersController).create({
      request: { body: request.body as CreateUserInput },
    }),
});

const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: router.build(),
});

export const buildApp = () =>
  createApp({
    modules: [UsersModule],
    security: {
      cors: true,
      helmet: true,
    },
  });
```

## 3. Crie `src/server.ts`

```ts
import { buildApp } from './app.js';

const app = await buildApp();

await app.listen({
  port: 3000,
  host: '0.0.0.0',
});
```

## 4. Rode a aplicação

Se o seu projeto usa `tsx`:

```bash
npx tsx src/server.ts
```

Ou via script:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts"
  }
}
```

Depois:

```bash
npm run dev
```

## 5. Teste as rotas

Listar usuários:

```bash
curl http://localhost:3000/users
```

Criar usuário:

```bash
curl -X POST http://localhost:3000/users \
  -H "content-type: application/json" \
  -d "{\"name\":\"Ada Lovelace\",\"email\":\"ada@example.com\"}"
```

## O que está acontecendo

### `createRouter()`

Agrupa as rotas da feature. Cada rota recebe um `handler`, e opcionalmente `schema`, `middlewares`, `version`, `websocket` e `resilience`.

### `defineModule()`

Empacota o domínio `users`, registra os providers e informa ao framework quais rotas pertencem à feature.

### `createApp()`

Monta o runtime Fastify, cria o container de DI, registra hooks globais e publica endpoints internos como:

- `GET /`
- `GET /health`
- `GET /metrics`

## Estrutura sugerida para evoluir

Depois do primeiro passo, o arranjo mais comum é:

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

## Próximo nível

Quando a app mínima estiver clara para você, siga para:

- [Começando](/getting-started) para uma estrutura mais próxima de produção
- [createApp](/api/create-app)
- [defineModule](/api/define-module)
- [createRouter](/api/create-router)

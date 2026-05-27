# V12 Framework

<p align="center">
  <img src="https://raw.githubusercontent.com/lucas-felix/v12/main/logo.png" alt="V12 Logo" width="200" style="display: none;">
  <br>
  <b>Simple. Cohesive. Fast.</b>
  <br>
  Feature-driven backend framework for Node.js built on Fastify.
</p>

O `v12` e um framework backend para `Node.js` e `TypeScript` com foco em arquitetura por feature, bootstrap enxuto e APIs tipadas. A ideia central e simples: cada dominio da aplicacao nasce como um modulo coeso, com rotas, servicos, contratos e infraestrutura proximos entre si.

## Quick Start

```bash
npm install
npm run dev
```

Se voce quiser subir uma app minima sem depender da CLI, a estrutura mais curta e esta:

```ts
import { createApp, createRouter, defineModule } from 'v12';

class HealthController {
  check() {
    return { status: 'ok' };
  }
}

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(HealthController).check(),
});

const HealthModule = defineModule({
  name: 'health',
  providers: [HealthController],
  routes: router.build(),
});

const app = await createApp({
  modules: [HealthModule],
});

await app.listen({ port: 3000 });
```

## Como o framework se organiza

1. `createApp()` monta a aplicacao Fastify, registra middlewares globais e carrega modulos.
2. `defineModule()` descreve uma feature com providers, rotas, middlewares e eventos.
3. `createRouter()` declara as rotas da feature e conecta handlers ao container de DI.
4. Zod pode validar `body`, `params`, `querystring` e `headers` por rota.

## Exemplo real de feature

Um fluxo mais representativo costuma ficar assim:

```ts
import crypto from 'node:crypto';
import { z } from 'zod';
import { createApp, createRouter, defineModule } from 'v12';

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

const app = await createApp({
  modules: [UsersModule],
  security: {
    cors: true,
    helmet: true,
  },
});
```

Com isso, o framework expora:

- `GET /users`
- `POST /users`
- `GET /health`
- `GET /metrics`
- `GET /docs` quando a documentacao OpenAPI estiver habilitada

## O que vem no core

- DI nativa com providers por classe, token ou valor
- base HTTP sobre Fastify com hooks e middlewares
- validacao por schema
- seguranca com `cors`, `helmet`, cookies, upload e websocket
- observabilidade com logs estruturados, `x-request-id`, `/health` e `/metrics`
- auth, cache, mail, queue, storage e plugins oficiais

## CLI

A CLI acelera bastante o bootstrap:

```bash
# Gerar uma feature
npm run v12 -- generate feature users

# Gerar um resource CRUD
npm run v12 -- generate resource billing invoice --adapter prisma

# Gerar um mailer
npm run v12 -- generate mail users welcome-email

# Rodar migracoes
npm run v12 -- migrate dev

# Gerar um SDK TypeScript
npm run v12 -- sdk
```

## Documentacao

A documentacao completa vive em [`docs/`](./docs/) e pode ser rodada localmente com:

```bash
npm run docs:dev
```

Paginas recomendadas para comecar:

- [`docs/introduction/quick-start.md`](./docs/introduction/quick-start.md)
- [`docs/guides/first-application.md`](./docs/guides/first-application.md)
- [`docs/api/create-app.md`](./docs/api/create-app.md)
- [`docs/api/define-module.md`](./docs/api/define-module.md)
- [`docs/api/create-router.md`](./docs/api/create-router.md)

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
    users.repository.ts
```

## License

MIT

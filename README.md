# V12 Framework

<p align="center">
  <b>Simple. Cohesive. Fast.</b>
  <br>
  Framework backend feature-driven para Node.js, TypeScript e Fastify.
</p>

O `@eddiecbrl/v12` é um framework para construção de APIs modulares com foco em:

- organização por feature, não por camada solta
- bootstrap enxuto
- validação tipada com Zod
- DI simples e previsível
- base pronta para segurança, observabilidade, SDK e plugins

Se a sua equipe quer começar rápido sem perder legibilidade quando o projeto crescer, essa é a proposta do V12.

## Instalação

```bash
npm install @eddiecbrl/v12 zod
```

Para desenvolvimento local do próprio framework:

```bash
npm install
npm run dev
```

## Exemplo mínimo

```ts
import { createApp, createRouter, defineModule } from '@eddiecbrl/v12';

class PingController {
  check() {
    return { pong: true };
  }
}

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(PingController).check(),
});

const PingModule = defineModule({
  name: 'ping',
  providers: [PingController],
  routes: router.build(),
});

const app = await createApp({
  modules: [PingModule],
});

await app.listen({ port: 3000 });
```

Isso expõe:

- `GET /ping`
- `GET /`
- `GET /health`
- `GET /metrics`

## Como pensar o framework

No V12, cada feature tende a ficar próxima de si mesma:

```txt
src/
  features/
    users/
      users.module.ts
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.schemas.ts
      users.repository.ts
  app.ts
  server.ts
```

O fluxo principal é:

1. `createRouter()` declara as rotas.
2. `defineModule()` empacota a feature.
3. `createApp()` monta a aplicação Fastify, container, hooks e plugins.

## Exemplo mais realista

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

const app = await createApp({
  modules: [UsersModule],
  security: {
    cors: true,
    helmet: true,
  },
});

await app.listen({ port: 3000 });
```

## O que já vem no core

- DI com classes, tokens, factories e values
- Fastify como runtime HTTP
- validação de `body`, `params`, `querystring` e `headers`
- padrões de resiliência: retry, timeout, fallback, bulkhead e circuit breaker
- recursos de segurança como CORS, Helmet, cookies, multipart e WebSocket
- observabilidade com logs estruturados, `x-request-id`, `/health` e `/metrics`
- plugins como OpenAPI, SDK e devtools

## CLI

A CLI pode ser usada pelo binário gerado ou via script local:

```bash
npx v12 --help
npm run v12 -- --help
```

Exemplos:

```bash
npx v12 init
npx v12 generate feature users
npx v12 generate resource billing invoice --adapter prisma
npx v12 generate route users export-report --method POST --path /reports/export
npx v12 sdk --output ./sdk.ts --url http://localhost:3000
```

## Documentação

A documentação VitePress fica em [`docs/`](./docs/).

Rodando localmente:

```bash
npm run docs:dev
```

Páginas recomendadas:

- [Home da documentação](./docs/index.md)
- [Instalação](./docs/introduction/installation.md)
- [Quick Start](./docs/introduction/quick-start.md)
- [Começando](./docs/getting-started.md)
- [API `createApp`](./docs/api/create-app.md)
- [API `defineModule`](./docs/api/define-module.md)
- [API `createRouter`](./docs/api/create-router.md)
- [API da CLI](./docs/api/cli.md)

## Scripts úteis

```bash
npm run build
npm run test
npm run typecheck
npm run docs:build
```

## Licença

MIT

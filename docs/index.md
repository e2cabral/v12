---
layout: home

hero:
  name: V12
  text: Framework backend feature-driven para Node.js
  tagline: Arquitetura modular, DX forte e documentação pensada para uso real em equipe.
  actions:
    - theme: brand
      text: Instalação
      link: /introduction/installation
    - theme: alt
      text: Quick Start
      link: /introduction/quick-start

features:
  - title: Feature-first
    details: Cada domínio fica próximo de si mesmo, com rotas, serviços, schemas, testes e infraestrutura organizados por feature.
  - title: Core enxuto
    details: HTTP, DI, validação, segurança, resiliência e observabilidade convivem num runtime pequeno e direto.
  - title: CLI útil
    details: Gere features, resources, rotas, controllers, services, schemas e SDK com convenções consistentes.
  - title: Produção em mente
    details: Logs estruturados, x-request-id, healthcheck, métricas, OpenAPI, plugins e guias operacionais.
---

## O V12 em menos de 1 minuto

O `@eddiecbrl/v12` é um framework backend para `Node.js` e `TypeScript` construído sobre Fastify. A ideia central é simples: **a feature é a unidade principal da aplicação**.

Em vez de espalhar arquivos por camadas globais como `controllers/`, `services/` e `repositories/`, o V12 incentiva que cada domínio tenha seu próprio boundary.

## Quando ele faz sentido

O V12 tende a encaixar bem quando você quer:

- crescer uma API sem virar uma colcha de retalhos estrutural
- padronizar a criação de features num time
- manter controllers finos e regras de negócio mais fáceis de testar
- ter uma base pronta para segurança, validação, docs e observabilidade

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

## Exemplo de feature completa

```ts
import crypto from 'node:crypto';
import { z } from 'zod';
import { createRouter, defineModule } from '@eddiecbrl/v12';

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

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: router.build(),
});
```

## Como a aplicação costuma ficar

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

## O que vem pronto

- `createApp()` para bootstrap do runtime
- `defineModule()` para modelar features
- `createRouter()` para declarar rotas
- validação com Zod
- auth com JWT, API key e OAuth helpers
- cache, queue, mail, storage e database adapters
- testing helpers
- plugin OpenAPI e geração de SDK

## Primeiros passos recomendados

1. Leia [Instalação](/introduction/installation).
2. Siga [Quick Start](/introduction/quick-start).
3. Monte a primeira feature com [Começando](/getting-started).
4. Consulte a referência de [createApp](/api/create-app), [defineModule](/api/define-module) e [createRouter](/api/create-router).

## Links rápidos

- [Introdução](/introduction/)
- [Instalação](/introduction/installation)
- [Quick Start](/introduction/quick-start)
- [Começando](/getting-started)
- [Conceitos](/concepts/)
- [Arquitetura](/architecture/)
- [API Reference](/api/)
- [CLI](/api/cli)

---
layout: home

hero:
  name: V12
  text: Framework backend feature-driven para Node.js
  tagline: Arquitetura modular, DX forte e documentacao pensada para adocao real.
  actions:
    - theme: brand
      text: Instalacao rapida
      link: /introduction/installation
    - theme: alt
      text: Quick Start
      link: /introduction/quick-start

features:
  - title: Feature-first
    details: Organize por dominio, nao por camada global. Cada feature nasce quase independente.
  - title: Core enxuto
    details: HTTP, DI, configuracao, validacao, erros, plugins, auth e testing em uma base coesa.
  - title: CLI forte
    details: Gere features, routes, resources e remova artefatos com fluxo consistente.
  - title: Producao em mente
    details: Logs, OpenAPI, metricas, auth, guards e guidelines de seguranca e performance.
---

## O V12 em menos de 30 segundos

O `v12` e um framework backend para `Node.js` e `TypeScript` focado em **arquitetura orientada a features**, **baixo acoplamento** e **boa experiencia de desenvolvimento**. Ele foi desenhado para equipes que querem velocidade no inicio sem pagar com caos estrutural quando a base crescer.

## Instalacao rapida

```bash
npm install
npm run dev
```

## Exemplo minimo

```ts
import { createApp } from 'v12';
import { UsersModule } from './features/users/users.module.js';

const app = await createApp({
  modules: [UsersModule],
});

await app.listen({ port: 3000 });
```

## Exemplo de feature completa

```ts
import crypto from 'node:crypto';
import { z } from 'zod';
import { createRouter, defineModule } from 'v12';

const createUserSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

class UsersService {
  private readonly users: Array<{ id: string; name: string; email: string }> = [];

  list() {
    return this.users;
  }

  create(input: { name: string; email: string }) {
    const user = { id: crypto.randomUUID(), ...input };
    this.users.push(user);
    return user;
  }
}

class UsersController {
  static inject = [UsersService] as const;

  constructor(private readonly usersService: UsersService) {}

  list = async () => this.usersService.list();

  create = async ({ request }: { request: { body: { name: string; email: string } } }) =>
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
      request: { body: request.body as { name: string; email: string } },
    }),
});

export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: router.build(),
});
```

## Beneficios

- onboarding rapido para novos devs
- separacao clara entre HTTP, aplicacao e persistencia
- convencoes fortes sem perder extensibilidade
- documentacao como fonte unica da verdade

## Recursos principais

- `createApp()`
- `defineModule()`
- `createRouter()`
- validacao com Zod
- auth com JWT e API key
- plugin system
- OpenAPI e docs
- CLI de scaffold e remocao

## Comparacoes

- Se voce gosta da objetividade do Fastify, o `v12` conversa bem com isso.
- Se voce gosta do modelo mental estruturado do NestJS, o `v12` entrega organizacao com menos ceremony.
- Se voce valoriza DX como Vite, Next.js e Prisma, a CLI e as convencoes do `v12` seguem essa direcao.

## Roadmap

O `v12` atingiu sua maturidade core. Veja o estado atual e planos futuros em [Roadmap](/roadmap/).

## Comunidade

O projeto ainda esta jovem, mas a meta da documentacao e ja operar como material de framework maduro: onboarding, arquitetura, referencia, guides e cookbook.

## Quick Links

- [O que e o V12](/introduction/)
- [Quick Start](/introduction/quick-start)
- [Primeira aplicacao](/guides/first-application)
- [Conceitos fundamentais](/concepts/)
- [Arquitetura interna](/architecture/)
- [API Reference](/api/)
- [CLI](/api/cli)

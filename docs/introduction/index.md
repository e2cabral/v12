# O que é o V12

O `@eddiecbrl/v12` é um framework backend para `Node.js` que combina:

- organização por feature
- runtime HTTP baseado em Fastify
- injeção de dependência simples
- validação tipada com Zod
- extensibilidade via plugins e providers

Ele não tenta apenas "subir um servidor". A proposta é ajudar a equipe a manter estrutura, clareza e previsibilidade conforme a aplicação cresce.

## Quando usar

O V12 costuma ser uma boa escolha quando você quer:

- construir APIs com módulos bem separados por domínio
- evitar uma base espalhada por pastas globais como `controllers/` e `services/`
- acelerar onboarding com convenções fortes
- manter espaço para plugins, docs, telemetria e recursos de produção

## O problema que ele resolve

Em aplicações Node.js, expor rotas é a parte fácil. O que costuma ficar caro com o tempo é manter:

- coerência arquitetural
- fronteiras de responsabilidade
- testabilidade
- extensibilidade sem retrabalho

O V12 organiza essas peças em torno da feature como boundary primário.

## Modelo mental

Em vez de pensar primeiro em camadas técnicas, você tende a pensar assim:

```txt
users/
  users.module.ts
  users.routes.ts
  users.controller.ts
  users.service.ts
  users.schemas.ts
  users.repository.ts
```

Ou seja: a feature reúne HTTP, aplicação, contratos e persistência perto do problema de negócio que ela resolve.

## O que compõe o framework

No uso mais comum, quatro peças aparecem o tempo todo:

1. `createRouter()` declara rotas e schemas.
2. `defineModule()` empacota a feature.
3. `createApp()` monta o runtime.
4. O container resolve controllers, services e outros providers.

## Exemplo curto

```ts
import { createApp, createRouter, defineModule } from '@eddiecbrl/v12';

class PingController {
  get() {
    return { pong: true };
  }
}

const router = createRouter();

router.get('/', {
  handler: ({ container }) => container.resolve(PingController).get(),
});

const PingModule = defineModule({
  name: 'ping',
  providers: [PingController],
  routes: router.build(),
});

const app = await createApp({
  modules: [PingModule],
});
```

## O que já vem pronto

- `GET /` com página de boas-vindas ou JSON
- `GET /health`
- `GET /metrics`
- `x-request-id` por request
- tratamento padronizado de erros
- validação de `body`, `params`, `querystring` e `headers`

## O que ele não tenta esconder

O V12 não esconde o Fastify atrás de uma camada excessivamente mágica. A intenção é oferecer convenções e ergonomia sem apagar os conceitos do runtime que está por baixo.

## Próximas leituras

- [Instalação](/introduction/installation)
- [Quick Start](/introduction/quick-start)
- [Começando](/getting-started)
- [Filosofia](/introduction/philosophy)
- [Conceitos](/concepts/)

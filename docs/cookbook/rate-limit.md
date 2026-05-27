# Rate Limiting e Segurança

Este cookbook mostra como usar `pluginRateLimit()` no V12 e como combinar isso com outras medidas de proteção.

## 1. Rate limit global

```ts
import { createApp, pluginRateLimit } from '@eddiecbrl/v12';

const app = await createApp({
  plugins: [
    pluginRateLimit({
      max: 100,
      timeWindow: '1 minute',
    }),
  ],
});
```

Esse limite se aplica a toda a aplicação.

## 2. Configuração mais rígida para auth

Uma boa estratégia é usar limites mais duros em apps expostas à internet:

```ts
const app = await createApp({
  plugins: [
    pluginRateLimit({
      max: 20,
      timeWindow: '1 minute',
    }),
  ],
  security: {
    helmet: true,
    cors: true,
  },
});
```

## 3. Configurações avançadas

O plugin aceita opções do `@fastify/rate-limit`.

```ts
pluginRateLimit({
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
  continueExceeding: true,
  skipOnError: true,
})
```

## 4. Redis para múltiplas instâncias

Se a aplicação roda em mais de uma instância, convém usar Redis para o contador ficar compartilhado.

```ts
const app = await createApp({
  redis: { url: 'redis://localhost:6379' },
  plugins: [
    pluginRateLimit({
      max: 100,
      timeWindow: '1 minute',
    }),
  ],
});
```

## 5. Combinando com auth

Rate limit não substitui autenticação. O arranjo saudável costuma ser:

- `helmet`
- `cors`
- `jwt(...)` ou `apiKey(...)`
- `pluginRateLimit(...)`

## 6. O que acompanhar

Monitore:

- respostas `429`
- rotas mais atingidas
- IPs ou clientes que mais estouram limite
- impacto em login e webhooks

## Boas práticas

- seja mais rígido em login, reset de senha e webhooks
- use Redis em ambiente distribuído
- não aplique limite tão baixo que penalize usuários legítimos
- combine rate limit com logs e observabilidade

## Links relacionados

- [Security API](/api/security)
- [Observabilidade](/guides/observability)

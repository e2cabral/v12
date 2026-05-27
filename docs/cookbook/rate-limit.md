# Rate Limiting e Segurança

Proteger sua API contra abusos, ataques de força bruta e DoS (Denial of Service) é essencial. O V12 fornece ferramentas integradas para aplicar limites de requisição de forma simples.

## 1. Rate Limit Global

A forma mais fácil de proteger sua aplicação é habilitar o plugin de rate limit no `createApp`.

```ts
import { createApp, pluginRateLimit } from 'v12';

const app = await createApp({
  plugins: [
    pluginRateLimit({
      max: 100, // Máximo de 100 requisições
      timeWindow: '1 minute' // Por minuto
    })
  ],
  // ...
});
```

Este limite será aplicado a todos os endpoints do sistema baseado no endereço IP do cliente.

## 2. Configurações Avançadas

O `pluginRateLimit` aceita todas as opções do pacote `@fastify/rate-limit`, permitindo customizar como as chaves são geradas e qual a resposta de erro.

```ts
pluginRateLimit({
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'],
  continueExceeding: true,
  skipOnError: true
})
```

## 3. Segurança Adicional (Helmet)

O V12 habilita automaticamente o [Helmet](https://helmetjs.github.io/) por padrão, que configura diversos headers HTTP de segurança:
-   `X-Content-Type-Options: nosniff`
-   `X-Frame-Options: SAMEORIGIN`
-   `Strict-Transport-Security` (HSTS)
-   `Content-Security-Policy`

## 4. Proteção contra Injeção

Ao utilizar os plugins de Banco de Dados oficiais (`Prisma` ou `Drizzle`) e a validação `Zod` do V12, você já está protegido contra os ataques mais comuns:

-   **SQL Injection**: Repositórios usam queries parametrizadas automaticamente.
-   **NoSQL Injection**: Validação de tipos garante que o input seja o esperado.
-   **Mass Assignment**: O V12 incentiva o uso de DTOs, garantindo que apenas campos permitidos sejam processados.

## Resumo de Boas Práticas

1.  **Fail Fast**: Aplique limites restritos em rotas de autenticação.
2.  **Use Redis**: Para rate limit em ambientes com múltiplas instâncias (cluster), configure o Redis no V12 para que o contador de requisições seja compartilhado.
3.  **Monitore**: Fique de olho nos logs de `429 Too Many Requests` para identificar possíveis ataques ou necessidade de aumentar os limites para usuários legítimos.

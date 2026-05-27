# Resiliência Nativa

O V12 permite aplicar resiliência direto nas rotas, o que é ótimo para integrações externas e partes do sistema com custo maior de falha.

## Quando usar

Esses mecanismos fazem mais sentido quando a rota depende de:

- API de terceiros
- banco remoto ou lento
- fila, cache ou serviço de rede instável
- operação que pode saturar o processo

## Exemplo completo

```ts
import { createRouter } from '@eddiecbrl/v12';

const router = createRouter();

router.get('/external-catalog', {
  resilience: {
    retry: { attempts: 3, delay: 100 },
    timeout: { milliseconds: 1500 },
    circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 },
    bulkhead: { maxParallel: 10, maxQueue: 0 },
    fallback: {
      fallbackValue: [],
    },
  },
  handler: async ({ signal }) => {
    const response = await fetch('https://partner.example/catalog', { signal });
    return response.json();
  },
});
```

## O que cada padrão resolve

## Retry

Tenta novamente em falhas transitórias.

Use quando:

- o serviço externo falha ocasionalmente
- há race de infraestrutura curta

Evite quando:

- a operação não é idempotente
- o erro não tem chance real de desaparecer na nova tentativa

## Timeout

Impede requests pendurados por tempo demais.

Use quase sempre que houver I/O externo.

O `handler` recebe `signal` no `RequestContext`, então você pode repassar isso para `fetch`.

## Circuit breaker

Interrompe tentativas repetidas quando a dependência está claramente ruim.

Bom para evitar cascata de falhas e saturação do app.

## Bulkhead

Limita concorrência para uma categoria de operação.

Útil para impedir que uma integração “coma” o processo todo.

## Fallback

Entrega uma resposta degradada, porém controlada.

Bom para:

- dados de cache
- listas vazias aceitáveis
- estados “temporariamente indisponível”

## Exemplo com fallback amigável

```ts
router.get('/pricing', {
  resilience: {
    timeout: { milliseconds: 1200 },
    fallback: {
      fallbackValue: {
        stale: true,
        items: [],
      },
    },
  },
  handler: async ({ signal }) => {
    const response = await fetch('https://partner.example/pricing', { signal });
    return response.json();
  },
});
```

## Exemplo com bulkhead por identificador

Se quiser controlar concorrência compartilhada entre rotas, use `identifier`.

```ts
router.get('/partner-a/orders', {
  resilience: {
    bulkhead: {
      identifier: 'partner-a',
      maxParallel: 5,
      maxQueue: 10,
    },
  },
  handler: async () => ({ ok: true }),
});

router.get('/partner-a/customers', {
  resilience: {
    bulkhead: {
      identifier: 'partner-a',
      maxParallel: 5,
      maxQueue: 10,
    },
  },
  handler: async () => ({ ok: true }),
});
```

## Resiliência em eventos

Eventos também aceitam retry:

```ts
events: [
  {
    event: 'invoice.paid',
    handler: SendReceiptHandler,
    resilience: {
      retry: {
        attempts: 3,
        delay: 100,
      },
    },
  },
]
```

## Estratégia prática

Uma combinação saudável para endpoints externos costuma ser:

1. `timeout`
2. `retry`
3. `fallback`

Adicione `circuitBreaker` e `bulkhead` quando a integração for crítica ou volumosa.

## Cuidados

- retry demais aumenta latência e pressão em dependência ruim
- fallback silencioso demais pode mascarar problema sério
- timeout curto demais gera falso negativo
- bulkhead com fila grande demais só troca erro rápido por lentidão

## Observabilidade

Se você usa resiliência, vale acompanhar:

- tempo médio das dependências
- taxa de timeout
- taxa de fallback
- taxa de circuito aberto
- rejeições por bulkhead

## Links relacionados

- [Resiliência API](/api/resilience)
- [Observabilidade](/guides/observability)
- [createRouter](/api/create-router)

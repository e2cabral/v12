# Resiliência API

O V12 expõe utilitários de resiliência que podem ser usados manualmente em services ou declarativamente por rota.

## O que existe hoje

- `withRetry()`
- `withTimeout()`
- `withFallback()`
- `withBulkhead()`
- `CircuitBreaker`
- integração com `route.resilience`

## `withRetry(fn, options)`

Executa uma função assíncrona com tentativas adicionais.

### Opções

- `attempts` padrão `3`
- `delay` padrão `1000`
- `backoff` padrão `true`
- `onRetry(error, attempt)`
- `shouldRetry(error)`

### Exemplo

```ts
import { withRetry } from '@eddiecbrl/v12';

const result = await withRetry(
  async () => callExternalService(),
  {
    attempts: 3,
    delay: 200,
    backoff: true,
  },
);
```

## `withTimeout(fn, options)`

Impõe limite de tempo e injeta `AbortSignal` na função.

### Opções

- `milliseconds` padrão `5000`
- `message` padrão `'Operation timed out'`

### Exemplo

```ts
import { withTimeout } from '@eddiecbrl/v12';

const result = await withTimeout(
  async (signal) => {
    const response = await fetch('https://example.com/api', { signal });
    return response.json();
  },
  {
    milliseconds: 2000,
    message: 'Partner API timed out',
  },
);
```

Quando estoura, lança `AppError` com:

- `code: 'TIMEOUT'`
- `statusCode: 408`

## `withFallback(fn, options)`

Retorna um valor alternativo quando a operação falha.

### Opções

- `fallbackValue`
- `onFallback(error)`
- `shouldFallback(error)`

### Exemplo com valor estático

```ts
import { withFallback } from '@eddiecbrl/v12';

const result = await withFallback(
  async () => loadProfile(),
  {
    fallbackValue: { unavailable: true },
  },
);
```

### Exemplo com função

```ts
const result = await withFallback(
  async () => loadProfile(),
  {
    fallbackValue: (error) => ({
      unavailable: true,
      message: error instanceof Error ? error.message : 'unknown',
    }),
  },
);
```

## `withBulkhead(identifier, fn, options)`

Controla concorrência para uma operação nomeada.

### Opções

- `maxParallel` padrão `10`
- `maxQueue` padrão `0`

### Exemplo

```ts
import { withBulkhead } from '@eddiecbrl/v12';

const result = await withBulkhead(
  'payments-provider',
  async () => callPaymentsApi(),
  {
    maxParallel: 5,
    maxQueue: 20,
  },
);
```

Quando não há capacidade disponível, lança erro com:

- `code: 'BULKHEAD_LIMIT'`
- `statusCode: 429`

## `CircuitBreaker`

Abre o circuito quando falhas consecutivas passam do limite.

### Opções

- `failureThreshold` padrão `5`
- `resetTimeout` padrão `30000`
- `onOpen`
- `onClose`
- `onHalfOpen`
- `redis: { client, key }`

### Exemplo

```ts
import { CircuitBreaker } from '@eddiecbrl/v12';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30_000,
});

const result = await breaker.execute(async () => callExternalService());
```

Quando aberto, lança:

- `code: 'CIRCUIT_OPEN'`
- `statusCode: 503`

Se Redis estiver configurado na app e a rota usar circuit breaker, o framework pode compartilhar o estado do circuito entre instâncias usando Redis.

## Resiliência declarativa em rotas

As rotas aceitam:

```ts
resilience: {
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  timeout?: TimeoutOptions;
  bulkhead?: BulkheadOptions & { identifier?: string };
  fallback?: FallbackOptions<any>;
}
```

## Exemplo completo numa rota

```ts
import { createRouter } from '@eddiecbrl/v12';

const router = createRouter();

router.get('/external-api', {
  resilience: {
    retry: { attempts: 3, delay: 100 },
    timeout: { milliseconds: 2000 },
    circuitBreaker: { failureThreshold: 5, resetTimeout: 30000 },
    bulkhead: { maxParallel: 10, maxQueue: 0 },
    fallback: {
      fallbackValue: { message: 'Serviço temporariamente indisponível' },
    },
  },
  handler: async ({ signal }) => {
    const response = await fetch('https://example.com', { signal });
    return response.json();
  },
});
```

## Ordem em que o pipeline é composto

Na implementação atual:

1. `retry`
2. `circuitBreaker`
3. `bulkhead`
4. `timeout`
5. `fallback`

Isso significa que o `fallback` envolve a cadeia inteira e pode absorver falhas dos mecanismos anteriores.

## Dicas práticas

- use `retry` apenas em falhas transitórias
- use `timeout` em tudo que depende de I/O externo
- use `fallback` quando resposta degradada for aceitável
- use `bulkhead` para integrações que podem saturar a aplicação
- use `circuit breaker` em dependências que falham em cascata

## Exemplo em service

```ts
import { withRetry, withTimeout, withFallback } from '@eddiecbrl/v12';

export async function loadCatalog() {
  return withFallback(
    () =>
      withRetry(
        () =>
          withTimeout(
            async (signal) => {
              const response = await fetch('https://partner.example/catalog', { signal });
              return response.json();
            },
            { milliseconds: 1500 },
          ),
        { attempts: 3, delay: 100 },
      ),
    {
      fallbackValue: [],
    },
  );
}
```

## Links relacionados

- [Guia de Resiliência](/guides/resilience)
- [createRouter](/api/create-router)
- [Observabilidade](/guides/observability)

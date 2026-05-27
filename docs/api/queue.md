# Queue API

O V12 expõe wrappers simples sobre BullMQ:

- `QueueService`
- `WorkerService`

## `QueueService`

Responsável por obter filas e adicionar jobs.

## Exemplo

```ts
import { QueueService } from '@eddiecbrl/v12';

const queue = new QueueService({ host: 'localhost', port: 6379 });

await queue.add('orders', 'process-payment', {
  orderId: '123',
});
```

## Métodos

### `get(name, options?)`

Retorna ou cria uma fila pelo nome.

```ts
const ordersQueue = queue.get('orders');
```

### `add(queueName, jobName, data, options?)`

Atalho para adicionar jobs.

```ts
await queue.add('emails', 'send-welcome', {
  email: 'user@example.com',
});
```

### `close()`

Fecha todas as filas abertas pelo service.

```ts
await queue.close();
```

## `WorkerService`

Responsável por registrar processadores de fila.

## Exemplo

```ts
import { WorkerService } from '@eddiecbrl/v12';

const workers = new WorkerService({ host: 'localhost', port: 6379 });

workers.register('orders', async (job) => {
  console.log(`Processando pedido ${job.data.orderId}`);
  return { ok: true };
});
```

## Métodos

### `register(queueName, handler, options?)`

```ts
workers.register('emails', async (job) => {
  console.log(job.name, job.data);
});
```

### `close()`

```ts
await workers.close();
```

## Exemplo de composição

```ts
class CheckoutService {
  static inject = [QueueService] as const;

  constructor(private readonly queue: QueueService) {}

  async checkout(orderId: string) {
    await this.queue.add('orders', 'process-payment', { orderId });
  }
}
```

Worker correspondente:

```ts
workers.register('orders', async (job) => {
  if (job.name === 'process-payment') {
    console.log(job.data.orderId);
  }
});
```

## Observações práticas

- a conexão Redis é passada no construtor
- `QueueService` e `WorkerService` não são registrados automaticamente pelo framework
- você normalmente cria e registra esses serviços como providers no bootstrap

## Exemplo com provider

```ts
const redisConnection = { host: 'localhost', port: 6379 };

const app = await createApp({
  providers: [
    {
      provide: QueueService,
      useValue: new QueueService(redisConnection),
    },
  ],
});
```

## Links relacionados

- [Jobs API](/api/jobs)
- [createApp](/api/create-app)

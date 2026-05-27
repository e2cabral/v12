# Queue API

O V12 utiliza o [BullMQ](https://docs.bullmq.io/) para gerenciar filas de processamento em background, oferecendo robustez e alta performance.

## QueueService

O `QueueService` é usado para adicionar jobs às filas.

```ts
import { QueueService } from 'v12';

class OrderController {
  constructor(private queue: QueueService) {}

  async checkout() {
    // Adiciona um job à fila 'orders'
    await this.queue.add('orders', 'process-payment', {
      orderId: '123'
    });
  }
}
```

### Métodos

- `get(name, options)`: Retorna uma instância da fila BullMQ.
- `add(queueName, jobName, data, options)`: Atalho para adicionar um job a uma fila específica.

## WorkerService

O `WorkerService` é usado para registrar processadores (workers) para suas filas.

```ts
import { WorkerService } from 'v12';

const workers = new WorkerService({ host: 'localhost', port: 6379 });

workers.register('orders', async (job) => {
  console.log(`Processando pedido ${job.data.orderId}`);
  // Lógica de processamento...
});
```

### Métodos

- `register(queueName, handler, options)`: Registra um novo worker do BullMQ para uma fila.
- `close()`: Fecha todos os workers registrados.

## Jobs

Os jobs podem ser definidos em módulos para registro automático em sistemas que suportam agendamento.

```ts
export const BillingModule = defineModule({
  name: 'billing',
  jobs: [
    {
      name: 'daily-report',
      cron: '0 0 * * *',
      handler: async () => { /* ... */ }
    }
  ]
});
```

## Configuração

O `QueueService` requer uma configuração do Redis para funcionar.

```ts
import { createApp, QueueService } from 'v12';

const app = await createApp({
  providers: [
    {
      provide: QueueService,
      useValue: new QueueService({ host: 'localhost', port: 6379 })
    }
  ]
});
```

## Links relacionados

- [createApp](/api/create-app)
- [defineModule](/api/define-module)
- [Redis](/api/create-app#redis)

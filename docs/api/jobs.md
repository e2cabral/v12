# Jobs API

O V12 oferece um sistema simples para definição e execução de jobs em background, integrado ao sistema de filas (Queue) quando necessário.

## Definindo um Job

Use a função `defineJob` para criar uma definição de job tipada.

```ts
import { defineJob } from 'v12';

export const SendWelcomeEmailJob = defineJob<{ email: string; name: string }>({
  name: 'send-welcome-email',
  retries: 3,
  handler: async (payload) => {
    // Lógica para enviar o e-mail
    console.log(`Enviando e-mail para ${payload.email}`);
  }
});
```

## Registrando Jobs em Módulos

Para que o V12 reconheça seus jobs, você deve registrá-los na definição do módulo.

```ts
import { defineModule } from 'v12';
import { SendWelcomeEmailJob } from './jobs/send-welcome-email.job.js';

export const UsersModule = defineModule({
  name: 'users',
  jobs: [SendWelcomeEmailJob],
  // ...
});
```

## Executando um Job via Fila

Para processar jobs de forma assíncrona usando Redis, utilize o `QueueService`.

```ts
import { QueueService } from 'v12';
import { SendWelcomeEmailJob } from './jobs/send-welcome-email.job.js';

export class UsersService {
  constructor(private queue: QueueService) {}

  async create(data: any) {
    // ...
    await this.queue.add('mail-queue', SendWelcomeEmailJob.name, {
      email: data.email,
      name: data.name
    });
  }
}
```

## Opções de Job

- `name`: Nome único do job.
- `handler`: Função que executa a lógica do job. Recebe o payload como argumento.
- `timeoutMs`: Tempo máximo de execução em milissegundos.
- `retries`: Número de tentativas em caso de falha.

## Links relacionados

- [Queue API](/api/queue)
- [Events API](/api/events)

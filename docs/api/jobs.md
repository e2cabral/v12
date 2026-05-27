# Jobs API

O V12 expõe um tipo simples de job através de `defineJob()`. Hoje ele funciona principalmente como definição estruturada e tipada de trabalho assíncrono.

## `defineJob()`

Assinatura conceitual:

```ts
defineJob<TPayload>(job: JobDefinition<TPayload>)
```

## `JobDefinition`

```ts
type JobDefinition<TPayload = void> = {
  name: string;
  timeoutMs?: number;
  retries?: number;
  handler: (payload: TPayload) => Promise<void> | void;
}
```

## Exemplo

```ts
import { defineJob } from '@eddiecbrl/v12';

export const SendWelcomeEmailJob = defineJob<{ email: string; name: string }>({
  name: 'send-welcome-email',
  timeoutMs: 5000,
  retries: 3,
  handler: async (payload) => {
    console.log(`Enviando e-mail para ${payload.email}`);
  },
});
```

## Registro em módulo

`defineModule()` aceita `jobs`.

```ts
import { defineModule } from '@eddiecbrl/v12';

export const UsersModule = defineModule({
  name: 'users',
  jobs: [SendWelcomeEmailJob],
});
```

## O que isso significa hoje

É importante distinguir intenção de execução automática:

- o tipo `jobs` existe na definição de módulo
- `defineJob()` existe e tipa bem os jobs
- o runtime atual de `createApp()` não executa nem agenda esses jobs automaticamente

Então, hoje, jobs funcionam mais como contrato e organização do que como scheduler embutido.

## Ligando com filas

Se você quer execução assíncrona real, o caminho atual é usar `QueueService`.

```ts
await queue.add('mail-queue', SendWelcomeEmailJob.name, {
  email: user.email,
  name: user.name,
});
```

E depois registrar worker:

```ts
workers.register('mail-queue', async (job) => {
  await SendWelcomeEmailJob.handler(job.data);
});
```

## Quando usar `defineJob()`

Vale usar quando você quer:

- padronizar payload e nome do job
- manter job perto do domínio
- reutilizar a mesma definição entre fila, testes e documentação

## Links relacionados

- [Queue API](/api/queue)
- [Events API](/api/events)

# Logger API

O V12 usa Pino como base de logging.

## O que o projeto expõe

- `getLoggerOptions(options?)`
- `createLogger(options?)`

Além disso, no bootstrap da app o logger fica disponível no container com o token:

```txt
'Logger'
```

## `getLoggerOptions()`

Monta opções de logger com defaults do framework.

```ts
import { getLoggerOptions } from '@eddiecbrl/v12';

const options = getLoggerOptions();
```

Defaults atuais:

- `level = process.env.LOG_LEVEL ?? 'info'`
- redaction de:
  - `req.headers.authorization`
  - `password`
  - `token`

## `createLogger()`

Cria uma instância Pino já com os defaults do framework.

```ts
import { createLogger } from '@eddiecbrl/v12';

const logger = createLogger();

logger.info({ service: 'billing' }, 'service started');
```

## Uso no runtime

`createApp()` monta o Fastify com logger do framework e registra esse mesmo logger no container:

```ts
container.resolve('Logger')
```

## Exemplo em service

```ts
class UsersService {
  static inject = ['Logger'] as const;

  constructor(private readonly logger: any) {}

  async create(data: any) {
    this.logger.info({ email: data.email }, 'creating user');

    try {
      return { ok: true };
    } catch (error) {
      this.logger.error({ err: error }, 'failed to create user');
      throw error;
    }
  }
}
```

## Logs automáticos da app

O runtime já registra logs por request com:

- método
- URL
- status code
- duração
- `x-request-id`

## Boas práticas

- prefira logs estruturados
- não logue segredos
- use contexto útil como `userId`, `orderId`, `tenantId`
- mantenha mensagens curtas e legíveis

## Links relacionados

- [Observabilidade](/guides/observability)
- [createApp](/api/create-app)

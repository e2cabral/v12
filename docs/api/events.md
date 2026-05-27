# Events API

O V12 inclui um `EventBus` simples para comunicação assíncrona entre partes da aplicação e um registro automático de listeners via `defineModule()`.

## Peças principais

- `EventBus`
- `module.events`
- `EventRegistry`

## `EventBus`

O `EventBus` oferece três operações:

- `on(event, handler)`
- `emit(event, payload)`
- `emitAsync(event, payload)`

## Exemplo direto

```ts
import { EventBus } from '@eddiecbrl/v12';

const bus = new EventBus();

bus.on('user.created', async (payload) => {
  console.log('novo usuário', payload);
});

bus.emit('user.created', { id: 'u_1' });
await bus.emitAsync('user.created', { id: 'u_2' });
```

## Diferença entre `emit` e `emitAsync`

### `emit`

Dispara os handlers sem aguardar sua conclusão.

```ts
bus.emit('user.created', user);
```

Bom para side effects que não precisam bloquear o fluxo principal.

### `emitAsync`

Aguarda todos os handlers terminarem.

```ts
await bus.emitAsync('invoice.paid', invoice);
```

Use quando a chamada seguinte depende da conclusão dos listeners.

## Registro de eventos no módulo

A forma mais comum no V12 é declarar listeners em `defineModule()`:

```ts
import { defineModule } from '@eddiecbrl/v12';

export const UsersModule = defineModule({
  name: 'users',
  events: [
    {
      event: 'user.created',
      handler: async (payload) => {
        console.log('usuário criado', payload);
      },
    },
  ],
});
```

## Tipos de handler suportados

O registry aceita:

- função simples
- classe resolvida pelo container
- token `string` ou `symbol` resolvido pelo container

## Handler funcional

```ts
events: [
  {
    event: 'user.created',
    handler: async (payload) => {
      console.log(payload);
    },
  },
]
```

## Handler por classe com DI

Se o handler for uma classe registrada no container, o registry tenta resolvê-la e chamar seu método `handle`.

```ts
import { EventBus, defineModule } from '@eddiecbrl/v12';

class SendWelcomeEmail {
  static inject = ['MailService', 'EventBus'] as const;

  constructor(
    private readonly mailService: any,
    private readonly eventBus: EventBus,
  ) {}

  async handle(user: { email: string }) {
    await this.mailService.send(user.email, 'Bem-vindo');
  }
}

export const UsersModule = defineModule({
  name: 'users',
  providers: [SendWelcomeEmail],
  events: [
    {
      event: 'user.created',
      handler: SendWelcomeEmail,
    },
  ],
});
```

## Handler por token

```ts
const SEND_AUDIT = Symbol('SEND_AUDIT');

export const UsersModule = defineModule({
  name: 'users',
  providers: [
    {
      provide: SEND_AUDIT,
      useValue: async (payload: any) => {
        console.log('audit', payload);
      },
    },
  ],
  events: [
    {
      event: 'user.deleted',
      handler: SEND_AUDIT,
    },
  ],
});
```

## Retry em listeners

Hoje a resiliência de eventos cobre `retry`.

```ts
export const UsersModule = defineModule({
  name: 'users',
  events: [
    {
      event: 'user.created',
      handler: SendWelcomeEmail,
      resilience: {
        retry: {
          attempts: 3,
          delay: 100,
        },
      },
    },
  ],
});
```

## Emitindo eventos a partir de services

O `EventBus` é registrado no container e pode ser injetado.

```ts
import { EventBus } from '@eddiecbrl/v12';

export class CreateUserService {
  static inject = ['EventBus'] as const;

  constructor(private readonly events: EventBus) {}

  async execute(data: { email: string }) {
    const user = { id: 'u_1', ...data };

    this.events.emit('user.created', user);

    return user;
  }
}
```

## Como o registry resolve handlers

Na prática:

1. o módulo declara `events`
2. `createApp()` entrega essas definições ao `EventRegistry`
3. o registry conecta cada evento ao `EventBus`
4. quando o evento dispara, o handler é resolvido
5. se houver `retry`, ele é aplicado ao listener

## Boas práticas

- use eventos para side effects e integração entre partes do sistema
- prefira payloads pequenos e estáveis
- para listeners com dependências, use classe com `handle()`
- evite colocar regra principal do caso de uso dentro do listener

## Limites atuais

- não há persistência de eventos embutida
- não há fila distribuída embutida no `EventBus`
- resiliência em eventos hoje se limita a `retry`

## Links relacionados

- [defineModule](/api/define-module)
- [Resiliência](/api/resilience)
- [Conceitos de execução](/concepts/execution)

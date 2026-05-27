# Events API

O V12 inclui um `EventBus` integrado para facilitar a comunicação assíncrona e o desacoplamento entre diferentes partes da aplicação.

## EventBus

O `EventBus` permite registrar listeners para eventos específicos e disparar esses eventos de qualquer lugar que tenha acesso ao container de DI.

### Métodos

- `on(event, handler)`: Registra um listener para um evento.
- `emit(event, payload)`: Dispara um evento de forma síncrona (não aguarda os handlers).
- `emitAsync(event, payload)`: Dispara um evento e aguarda a execução de todos os handlers (`Promise.all`).

## Uso em Módulos

A forma mais comum de usar eventos é registrá-los na definição do módulo usando a propriedade `events`.

```ts
import { defineModule } from 'v12';

export const UsersModule = defineModule({
  name: 'users',
  events: [
    {
      event: 'user.created',
      handler: async (payload) => {
        console.log('Usuário criado:', payload);
      }
    }
  ],
  // ...
});
```

## Disparando Eventos

Você pode injetar o `EventBus` em seus services ou use cases para disparar eventos.

```ts
import { EventBus } from 'v12';

export class CreateUserService {
  constructor(private events: EventBus) {}

  async execute(data: any) {
    // ... lógica de criação
    const user = { id: 1, email: 'user@example.com' };

    // Dispara o evento
    this.events.emit('user.created', user);
    
    return user;
  }
}
```

## Eventos Assíncronos

Se você precisar garantir que todos os listeners terminaram de processar antes de continuar, use `emitAsync`.

```ts
await this.events.emitAsync('order.placed', order);
```

## Boas Práticas

- Use eventos para ações que não fazem parte do fluxo principal e que podem falhar sem interromper a operação (ex: envio de e-mail de boas-vindas).
- Mantenha os payloads dos eventos pequenos e contenha apenas os dados necessários (ex: IDs em vez de objetos completos).
- Evite dependências circulares através de eventos.

# Services

Services são o lugar preferido para regra de negócio no V12.

Eles ficam entre controller/rota e repository/integrações.

## Responsabilidades

Um service bem desenhado tende a:

- centralizar regra de domínio
- orquestrar repositories
- conversar com cache, eventos e integrações
- lançar erros claros
- continuar independente de HTTP

## O que evitar

Evite colocar em service:

- detalhes de `reply`
- leitura direta de headers
- composição de rota

Essas coisas pertencem mais à borda HTTP.

## Exemplo simples

```ts
import { AppError } from '@eddiecbrl/v12';

export class CreateUserService {
  static inject = [UsersRepository] as const;

  constructor(private readonly repository: UsersRepository) {}

  async execute(data: { name: string; email: string }) {
    const existing = await this.repository.findByEmail(data.email);

    if (existing) {
      throw new AppError('User already exists', {
        statusCode: 409,
        code: 'USER_ALREADY_EXISTS',
      });
    }

    return this.repository.create(data);
  }
}
```

## Registro no módulo

```ts
export const UsersModule = defineModule({
  name: 'users',
  providers: [
    CreateUserService,
    UsersRepository,
  ],
});
```

## Como a injeção funciona

O padrão atual do projeto usa `static inject`.

```ts
class BillingService {
  static inject = ['ClockService', UsersRepository] as const;

  constructor(
    private readonly clock: any,
    private readonly usersRepository: UsersRepository,
  ) {}
}
```

## Formatos comuns de service

### Service com método único

Bom para caso de uso bem fechado:

```ts
class CreateInvoiceService {
  async execute(input: any) {
    // ...
  }
}
```

### Service com vários métodos

Bom para domínio mais coeso:

```ts
class UsersService {
  list() {}
  get(id: string) {}
  create(data: any) {}
  update(id: string, data: any) {}
}
```

## Services e eventos

Services são um lugar natural para emitir eventos:

```ts
import { EventBus } from '@eddiecbrl/v12';

class CreateUserService {
  static inject = [UsersRepository, 'EventBus'] as const;

  constructor(
    private readonly repository: UsersRepository,
    private readonly events: EventBus,
  ) {}

  async execute(data: any) {
    const user = await this.repository.create(data);
    this.events.emit('user.created', user);
    return user;
  }
}
```

## Services e cache

```ts
class UsersService {
  static inject = [UsersRepository, CacheService] as const;

  constructor(
    private readonly repository: UsersRepository,
    private readonly cache: CacheService,
  ) {}

  async get(id: string) {
    return this.cache.remember(`users:${id}`, 300, async () => {
      return this.repository.findById(id);
    });
  }
}
```

## Sobre estado

Providers por classe são singleton por padrão. Então evite guardar estado específico de request em propriedade de instância.

Em caso de dado contextual de request:

- pegue isso no handler
- passe como argumento ao service

## Boas práticas

- deixe inputs e outputs explícitos
- concentre regra de domínio aqui
- use repositories para persistência
- use `AppError` ou subclasses para erros esperados
- passe contexto de request por parâmetro, não por estado oculto

## Links relacionados

- [Containers](/concepts/containers)
- [Modules](/concepts/modules)
- [Começando](/getting-started)

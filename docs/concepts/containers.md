# Containers



O container de Injeção de Dependência (DI) do V12 é responsável por gerenciar o ciclo de vida e a resolução de todas as dependências da aplicação.

## Funcionalidades

O container do V12 suporta:

- **Registro de Dependências**: Classes, valores constantes ou factories.
- **Resolução Automática**: Injeção de dependências via propriedade estática `inject`.
- **Escopos**: `singleton` (padrão) e `request`.
- **Hierarquia**: Criação de containers filhos para isolamento de contexto.

## Tipos de Providers

### Class Provider
Registra uma classe que será instanciada pelo container.

```ts
container.register({ provide: 'UserService', useClass: UserService });
// Ou forma curta se o token for a própria classe:
container.register(UserService);
```

### Value Provider
Registra um valor constante, como configurações ou instâncias pré-existentes.

```ts
container.register({ provide: 'Config', useValue: { apiUrl: '...' } });
```

### Factory Provider
Registra uma função que constrói a dependência, recebendo o container como argumento.

```ts
container.register({
  provide: 'Database',
  useFactory: (container) => {
    const config = container.resolve('Config');
    return new Database(config);
  }
});
```

## Injeção de Dependências

O V12 utiliza uma propriedade estática `inject` para declarar as dependências de uma classe.

```ts
class UsersController {
  static inject = [UsersService, 'Config'] as const;

  constructor(
    private usersService: UsersService,
    private config: any
  ) {}
}
```

## Escopos (Scopes)

- **singleton**: A instância é criada uma única vez e compartilhada por toda a aplicação.
- **request**: A instância é criada uma vez por requisição (dentro do container filho da requisição).

```ts
container.register({
  provide: UsersService,
  useClass: UsersService,
  scope: 'request'
});
```

## Containers Filhos (Child Containers)

O V12 cria automaticamente um container filho para cada requisição HTTP. Isso permite que dependências registradas com escopo `request` sejam resolvidas de forma isolada para cada usuário.

```ts
const child = container.createChild();
child.resolve(UsersService); // Nova instância se for escopo 'request'
```

## Links relacionados

- [Dependency Graph](/concepts/dependency-graph)
- [Dependency Injection avançada](/advanced/dependency-injection)

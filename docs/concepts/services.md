# Services

Services são o coração da lógica de negócio no V12. Eles são responsáveis por processar dados, aplicar regras de domínio, orquestrar repositórios e integrar-se com serviços externos.

## Responsabilidades

Um Service bem desenhado deve:

- **Centralizar a Lógica**: Evitar que regras de negócio vazem para controllers ou middlewares.
- **Ser Independente de Transporte**: Não deve conhecer detalhes do protocolo HTTP (como `request` ou `reply`).
- **Orquestrar Repositórios**: Combinar chamadas a múltiplos repositórios para completar uma transação.
- **Emitir Eventos**: Notificar outras partes do sistema sobre mudanças de estado importantes.
- **Gerenciar Erros de Domínio**: Lançar exceções claras que podem ser mapeadas para respostas HTTP.

## Definição e Injeção

No V12, Services são classes TypeScript registradas no container de DI através de módulos.

```ts
import { Injectable, Logger } from 'v12';
import { UsersRepository } from '../repositories/users.repository.js';

export class CreateUserService {
  constructor(
    private repository: UsersRepository,
    private logger: Logger
  ) {}

  async execute(data: CreateUserDTO) {
    this.logger.info({ email: data.email }, 'Iniciando criação de usuário');
    
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new BusinessError('Usuário já existe');
    }

    return this.repository.create(data);
  }
}
```

## Registro no Módulo

Para que um Service possa ser injetado, ele deve ser listado nos `providers` de um módulo.

```ts
export const UsersModule = defineModule({
  name: 'users',
  providers: [
    CreateUserService,
    UsersRepository
  ]
});
```

## Escopos de Service

Por padrão, todos os Services no V12 são **Singletons** por módulo (uma única instância por container). 

Se você precisar de um Service que seja recriado a cada requisição (por exemplo, para manter estado específico da request), você pode usar o `RequestContext` para resolver instâncias do container local da requisição.

## Boas Práticas

- **Interface Única**: Prefira o padrão "Command" com um método `execute()` ou `handle()` para services que fazem apenas uma coisa.
- **Injeção via Construtor**: Sempre use o construtor para declarar dependências, facilitando mocks em testes.
- **Evite Acoplamento Circular**: Se o Service A depende do B e o B depende do A, reavalie a divisão de responsabilidades.
- **Não abuse de Singletons para Estado**: Não armazene dados de usuários específicos em propriedades da classe do service, pois ele é compartilhado entre requisições.

## Links relacionados

- [Dependency Injection](/concepts/containers)
- [Modules](/concepts/modules)
- [Guia: Primeira Aplicação](/getting-started)

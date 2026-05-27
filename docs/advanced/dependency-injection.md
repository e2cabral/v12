# Dependency Injection Avançado

A Injeção de Dependência (DI) no V12 é inspirada em frameworks modernos, permitindo desacoplamento total entre lógica de negócio e infraestrutura.

## Tipos de Providers

O V12 suporta quatro formas de declarar um provider:

### 1. Class Provider (Simples)
A forma mais comum. O framework instancia a classe e resolve suas dependências automaticamente.
```ts
providers: [UserService]
```

### 2. Class Provider (Explícito)
Permite mapear um token (string ou symbol) para uma classe.
```ts
{ provide: 'IUserService', useClass: UserService }
```

### 3. Value Provider
Injeta um valor constante, como configurações ou instâncias de libs externas.
```ts
{ provide: 'API_KEY', useValue: 'secret-123' }
```

### 4. Factory Provider
Permite lógica complexa para criar a instância. Recebe o container como argumento.
```ts
{
  provide: 'DynamicService',
  useFactory: (container) => {
    const config = container.resolve(Config);
    return new DynamicService(config.get('mode'));
  }
}
```

## Escopos (Scopes)

O V12 gerencia o ciclo de vida das instâncias através de escopos:

| Escopo | Descrição |
| --- | --- |
| `singleton` | (Padrão) Uma única instância para toda a aplicação. |
| `request` | Uma instância nova para cada requisição HTTP. |

Exemplo de uso:
```ts
{ provide: MyService, useClass: MyService, scope: 'request' }
```

## Resolução de Dependências

As dependências são declaradas usando a propriedade estática `inject`:

```ts
export class OrderService {
  static inject = [UsersRepository, 'EmailService'];

  constructor(
    private users: UsersRepository,
    private email: EmailService
  ) {}
}
```

## Child Containers

Sempre que uma requisição HTTP chega, o V12 chama `container.createChild()`.
- O child container herda todos os providers do container pai.
- Providers registrados com scope `request` no pai serão instanciados apenas no contexto do child.
- Singletons resolvidos no pai são compartilhados com o filho.
- Instâncias criadas no child container são destruídas ao fim da requisição, liberando memória.

## Injeção Manual

Em casos raros, você pode precisar acessar o container diretamente:
```ts
const service = container.resolve(MyService);
```
Isso é desencorajado dentro de classes (Service Locator pattern), prefira sempre a injeção via construtor.

## Melhores Práticas

1. **Sempre prefira classes como tokens**: Isso garante segurança de tipos no TypeScript.
2. **Use Factory para libs externas**: Se uma lib não foi feita para o V12, use uma factory para integrá-la.
3. **Evite Singletons com Estado**: Singletons não devem armazenar dados específicos de um usuário. Use o escopo `request` para isso.



Boas práticas, limites atuais e extensões possíveis da DI do `v12`.

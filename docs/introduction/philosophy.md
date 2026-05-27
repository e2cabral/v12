# Filosofia

Resumo curto

A filosofia do `v12` é entregar um backend com convenções fortes, fronteiras claras e crescimento previsível.

## Quando usar

Leia esta página quando quiser entender o “porquê” por trás das decisões do framework.

## Conceito

Os princípios principais do `v12` são:

- feature-first
- convention over configuration
- testability first
- extensibilidade sem perder clareza

## Exemplo rápido

```ts
export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: buildUsersRoutes(),
});
```

## Explicação completa

O `v12` não tenta ser completamente neutro. Ele assume que:

- times performam melhor com convenções
- código de backend envelhece rápido sem boundaries claras
- produtividade inicial não pode destruir manutenção futura

Trade-offs assumidos:

- menos liberdade estrutural em troca de mais consistência
- abstrações pequenas em vez de meta-framework gigante
- foco em APIs e aplicações de negócio, não em todos os estilos possíveis

## Exemplos avançados

- scaffold por templates
- plugins próprios do `v12`
- resources CRUD conectados

## Boas práticas

- adote o padrão da documentação em vez de inventar um novo por equipe
- documente exceptions arquiteturais

## Anti-patterns

- usar o framework e ignorar as convenções principais
- transformar feature em “pasta de passagem”

## Performance

Mais convenção não deve significar mais custo de runtime.

## Segurança

A filosofia de segurança do `v12` é “secure by guideline”, com núcleo pequeno e extensões claras.

## FAQ

### Por que não organizar por camadas globais?

Porque essa estrutura tende a espalhar contexto do domínio e piorar manutenção.

## Links relacionados

- [O Que É O V12](/introduction/)
- [Modules](/concepts/modules)
- [Arquitetura](/architecture/)

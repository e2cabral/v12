# Modules

Resumo curto

Modules são a unidade de composição de features no `v12`.

## Quando usar

Sempre que uma feature precisar declarar providers, routes, events ou middlewares.

## Conceito

O módulo agrega os elementos que fazem uma feature existir no runtime.

## Exemplo rápido

```ts
export const UsersModule = defineModule({
  name: 'users',
  providers: [UsersService, UsersController],
  routes: buildUsersRoutes(),
});
```

## Explicação completa

Um módulo pode conter:

- `name`
- `providers`
- `routes`
- `middlewares`
- `events`
- `jobs`

## Erros comuns

- colocar lógica de negócio no módulo
- usar módulo como “índice genérico” sem ownership real

## Links relacionados

- [Services](/concepts/services)
- [defineModule](/api/define-module)

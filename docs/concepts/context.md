# Context

O `RequestContext` é um dos conceitos mais importantes do V12. Ele representa o ciclo de vida de uma única requisição HTTP e fornece acesso a tudo o que você precisa para processá-la.

## O que contém o Context?

Sempre que um handler de rota ou um middleware é executado, o V12 injeta um objeto de contexto que contém:

- **request**: O objeto de requisição do Fastify (headers, body, query, params).
- **reply**: O objeto de resposta do Fastify.
- **container**: Um container de DI **local** (Child Container), criado especificamente para esta requisição.
- **t**: Função auxiliar para internacionalização (i18n), já configurada com o locale do usuário.
- **logger**: Uma instância do logger com o `requestId` já injetado nos metadados.

## Uso em Handlers

O contexto é passado como o primeiro argumento para a função `handler`.

```ts
router.get('/me', {
  handler: async ({ request, container, t }) => {
    // request contém os dados da requisição
    const userId = request.user.id;

    // container resolve dependências no escopo da requisição
    const userService = container.resolve(UsersService);
    const user = await userService.findById(userId);

    return {
      message: t('welcome'),
      user
    };
  }
});
```

## Container Local vs Global

A propriedade `container` dentro do `RequestContext` é um "Child Container". Isso significa que:
1. Ele herda todos os providers registrados nos módulos.
2. Ele permite registrar providers que vivem apenas durante a requisição (ex: o usuário autenticado).
3. Ele é limpo automaticamente assim que a resposta é enviada.

## Estendendo o Contexto

Você pode adicionar propriedades customizadas ao contexto através de middlewares.

```ts
const myMiddleware = async (ctx) => {
  ctx.customData = 'Algum valor';
};

router.get('/test', {
  middlewares: [myMiddleware],
  handler: async (ctx) => {
    console.log(ctx.customData); // 'Algum valor'
  }
});
```

## Boas Práticas

- **Use desestruturação**: Facilita a leitura do que o handler realmente utiliza: `async ({ request, container }) => { ... }`.
- **Prefira o Container para Lógica**: Evite colocar muita lógica diretamente no contexto; use-o para resolver Services que contêm a lógica.
- **Acesse o Logger pelo Contexto**: Usar o `ctx.logger` garante que todos os logs daquela requisição compartilhem o mesmo `x-request-id`, facilitando o rastreamento em produção.

## Links relacionados

- [Request Pipeline](/architecture/request-pipeline)
- [Containers](/concepts/containers)
- [i18n API](/api/i18n)

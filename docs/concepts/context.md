# Context

O `RequestContext` é um dos conceitos mais importantes do V12. Ele representa o ciclo de vida de uma única requisição HTTP e fornece acesso a tudo o que você precisa para processá-la.

## O que contém o Context?

Sempre que um handler de rota é executado, o V12 injeta um objeto de contexto que contém:

- **request**: O objeto `FastifyRequest` (headers, body, query, params).
- **reply**: O objeto `FastifyReply` para controlar a resposta.
- **container**: Um container de DI **local** (Child Container), criado especificamente para esta requisição.
- **t**: Função auxiliar para internacionalização (i18n), já configurada com o locale do usuário.
- **connection**: A conexão WebSocket (presente apenas em rotas com `websocket: true`).
- **signal**: Um `AbortSignal` injetado quando há configuração de resiliência com timeout.

## Uso em Handlers

O contexto é passado como o primeiro argumento para a função `handler`.

```ts
router.get('/products', {
  handler: async ({ request, container, t }) => {
    // container resolve dependências no escopo da requisição
    const productService = container.resolve(ProductsService);
    const products = await productService.findAll();

    return {
      message: t('products.listed'),
      data: products,
    };
  },
});
```

## Container Local vs Global

A propriedade `container` dentro do `RequestContext` é um "Child Container". Isso significa que:
1. Ele herda todos os providers registrados nos módulos.
2. Ele permite registrar providers que vivem apenas durante a requisição (ex: o usuário autenticado).
3. Ele é limpo automaticamente assim que a resposta é enviada.

## WebSocket e Signal

Para rotas WebSocket, o contexto inclui `connection`:

```ts
router.get('/stream', {
  websocket: true,
  handler: async ({ connection }) => {
    connection.socket.send('connected');
  },
});
```

Quando a rota possui configuração de resiliência com `timeout`, o contexto inclui `signal`:

```ts
router.get('/external', {
  resilience: {
    timeout: { ms: 5_000 },
  },
  handler: async ({ signal, container }) => {
    const service = container.resolve(ExternalService);
    return service.fetch({ signal });
  },
});
```

## Boas Práticas

- **Use desestruturação**: Facilita a leitura do que o handler realmente utiliza: `async ({ request, container }) => { ... }`.
- **Prefira o Container para Lógica**: Evite colocar muita lógica diretamente no handler; use o container para resolver Services que contêm a lógica.
- **Delegue ao Controller**: Mantenha o handler curto, resolvendo o controller e chamando o método adequado.

## Links relacionados

- [Request Pipeline](/architecture/request-pipeline)
- [Containers](/concepts/containers)
- [i18n API](/api/i18n)

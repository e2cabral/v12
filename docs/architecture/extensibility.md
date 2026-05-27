# Extensibilidade

O V12 é construído sobre o princípio de "Aberto para Extensão, Fechado para Modificação". O framework oferece múltiplos pontos de entrada para que você possa personalizar seu comportamento sem precisar alterar o código fonte do core.

## Formas de Extender o V12

Existem quatro níveis principais de extensibilidade:

### 1. Plugins do Framework
Os plugins são a forma mais poderosa de extensão. Eles têm acesso ao ciclo de vida de bootstrap e podem registrar novos providers globais ou configurar instâncias do Fastify.
-   **Uso**: Ideal para integrar bibliotecas externas (ex: Redis, RabbitMQ, Firebase) ou criar funcionalidades transversais.
-   **Link**: [Guia de Criação de Plugins](/guides/plugins)

### 2. Providers e Injeção de Dependência
Como o V12 utiliza um sistema de DI robusto, você pode substituir qualquer componente do sistema simplesmente registrando um novo provider com o mesmo token.
-   **Uso**: Substituir um `MailService` real por um `MockMailService` durante testes, ou trocar a implementação de um repositório.

### 3. Middlewares e Guards
Você pode estender o pipeline de requisição adicionando lógicas customizadas.
-   **Middlewares**: Transformam a requisição ou a resposta.
-   **Guards**: Implementam lógicas de segurança personalizadas (ex: integração com provedores de identidade externos).

### 4. Eventos (Event Bus)
O sistema de eventos permite que módulos se estendam de forma desacoplada. Um módulo de "Logística" pode escutar o evento `order.paid` disparado pelo módulo de "Pagamentos" sem que um saiba da existência do outro.

## Padrão de Adapters

Para funcionalidades que podem ter múltiplas implementações (como Banco de Dados ou Armazenamento de Arquivos), o V12 recomenda o uso do padrão **Adapter**:

1.  Defina uma classe abstrata ou interface no Core.
2.  Crie implementações específicas (ex: `S3StorageAdapter`, `LocalStorageAdapter`).
3.  Registre a implementação desejada no momento do bootstrap.

```ts
// Exemplo de troca de implementação no createApp
const app = await createApp({
  providers: [
    { provide: StorageAdapter, useClass: S3StorageAdapter }
  ],
  // ...
});
```

## Boas Práticas de Extensão

-   **Evite Dependências Circulares**: Ao criar plugins ou módulos, certifique-se de que o fluxo de dependência seja sempre hierárquico.
-   **Documente seus Providers**: Se o seu plugin registra providers no container, documente os tokens e as interfaces para que outros desenvolvedores possam usá-los.
-   **Use Namespaces**: Ao disparar eventos ou registrar configurações, use prefixos (ex: `plugin.cache.ready`) para evitar colisões de nomes.

## Links relacionados

- [Plugins API](/api/plugins)
- [Dependency Injection](/concepts/containers)
- [Events API](/api/events)

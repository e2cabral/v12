# Dependency Graph

O Grafo de Dependências é a estrutura invisível que sustenta sua aplicação V12. Ele define como os módulos se conectam e como os providers são resolvidos.

## Como o V12 constrói o Grafo

1.  **Exploração de Módulos**: O framework começa pelo array de módulos passado no `createApp`.
2.  **Resolução de Sub-módulos**: Se o Módulo A importa o Módulo B, o V12 garante que B seja inicializado antes de A.
3.  **Registro de Providers**: Todos os providers (Services, Repositories, etc.) de todos os módulos são registrados no container global.
4.  **Injeção Just-in-Time**: Quando você solicita um Service, o container analisa o construtor da classe e resolve recursivamente todas as suas dependências.

## Fluxo de Dependências Recomendado

Mantenha uma arquitetura limpa seguindo um fluxo unidirecional:

```txt
Router -> Controller -> Service -> Repository -> Database
```

## Dependências Circulares

Uma dependência circular ocorre quando:
- O Service A depende do Service B.
- O Service B depende do Service A.

Isso causa um erro de estouro de pilha (stack overflow) ou um erro de "Circular dependency detected" durante a inicialização.

### Como resolver:
1.  **Refatoração**: Geralmente indica que uma responsabilidade comum deve ser extraída para um terceiro Service C.
2.  **Eventos**: Em vez de A chamar B diretamente, A pode disparar um evento que B escuta. Isso desacopla os dois serviços.
3.  **Injeção Tardia (Lazy)**: Use o `container` para resolver a dependência apenas no momento do uso, em vez de injetar no construtor.

## Visibilidade de Providers

Por padrão, no V12, todos os providers registrados em qualquer módulo são visíveis globalmente para qualquer outro módulo. Isso simplifica o desenvolvimento, mas exige disciplina para manter o desacoplamento.

## Boas Práticas

-   **Módulos de Domínio**: Agrupe providers relacionados no mesmo módulo.
-   **Dependa de Abstrações**: Sempre que possível, injete classes de base ou interfaces para facilitar a substituição por mocks.
-   **Mantenha o Grafo Raso**: Se um service tem 10 dependências, ele provavelmente está fazendo coisas demais (baixa coesão).

## Links relacionados

- [Containers](/concepts/containers)
- [Modules](/concepts/modules)
- [Services](/concepts/services)

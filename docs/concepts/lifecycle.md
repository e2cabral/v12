# Lifecycle

O V12 possui um ciclo de vida previsível, dividido em duas fases principais: **Bootstrap** (Inicialização) e **Request Cycle** (Ciclo de Requisição).

## 1. Fase de Bootstrap

Esta fase ocorre uma única vez quando a aplicação é iniciada.

1.  **Configuração**: Carregamento de variáveis de ambiente e validação do schema de configuração.
2.  **Container Global**: Criação do container raiz e registro dos providers do core (Logger, EventBus, etc).
3.  **Plugins Core**: Inicialização de componentes fundamentais (Database, Cache, Telemetry).
4.  **Registro de Módulos**: Cada módulo é carregado, registrando seus próprios providers, eventos, jobs e traduções no container global.
5.  **Montagem de Rotas**: O V12 percorre todos os módulos, extrai os roteadores e os registra no servidor Fastify.
6.  **Hooks de Inicialização**: Execução do hook `onReady` de todos os módulos e plugins.
7.  **Listen**: O servidor começa a aceitar conexões na porta configurada.

## 2. Fase de Request Cycle

Esta fase ocorre para cada requisição HTTP recebida.

1.  **Entrada**: O Fastify recebe a requisição.
2.  **Context Creation**: O V12 cria o `RequestContext` e o Child Container.
3.  **Middlewares Globais**: Execução de middlewares registrados em nível de app (ex: CORS, Helmet).
4.  **Route Match**: Identificação da rota e seus middlewares específicos.
5.  **Middlewares de Rota**: Execução sequencial dos middlewares da rota.
6.  **Validation**: Validação do body, query e params usando os schemas definidos na rota.
7.  **Handler**: Execução da função `handler` da rota.
8.  **Serialization**: Transformação do retorno do handler em JSON.
9.  **Response**: Envio da resposta ao cliente.
10. **Cleanup**: Destruição do Child Container e liberação de recursos.

## Hooks Disponíveis

Você pode intervir no ciclo de vida através de hooks:

-   **Módulos**: Propriedades `onReady` e `onClose` na definição do módulo.
-   **Plugins**: Funções passadas no `createApp`.
-   **Middlewares**: Interceptam o fluxo de requisição.

## Boas Práticas

-   **Evite Bloqueios no Bootstrap**: Operações pesadas no `onReady` podem atrasar o início do app. Se possível, use processamento em background.
-   **Limpeza de Recursos**: Sempre implemente o `onClose` para fechar conexões com bancos ou filas quando o app for encerrado.
-   **Idempotência**: Garanta que seus hooks de inicialização possam rodar múltiplas vezes sem efeitos colaterais (útil para testes).

## Links relacionados

- [Bootstrap Architecture](/architecture/bootstrap)
- [Request Pipeline Architecture](/architecture/request-pipeline)
- [Modules](/concepts/modules)

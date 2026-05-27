# Lifecycle Avançado

O V12 utiliza um modelo de inicialização determinístico que garante que todas as dependências estejam prontas antes do servidor começar a aceitar conexões.

## Ordem de Inicialização (Bootstrap)

Quando você chama `createApp()`, o seguinte fluxo é executado:

1.  **Configuração de Telemetria**: Se habilitada, o OpenTelemetry inicia primeiro para capturar traços da inicialização.
2.  **Instanciação do Fastify**: O core engine é criado com as opções de segurança e logs.
3.  **Registro de Plugins Globais**: CORS, Helmet, Cookies e Redis são registrados.
4.  **Criação do Container e EventBus**: O container de DI e o barramento de eventos globais são instanciados.
5.  **Carga de I18n**: As traduções de todos os módulos são fundidas no `I18nService`.
6.  **Registro de Providers**: 
    -   Providers do core (Logger, Events, I18n, Audit) são registrados.
    -   Providers globais passados no `createApp` são registrados.
    -   Providers de todos os módulos são registrados no container global.
7.  **Hooks do Fastify**: Registro de hooks como `onRequest`, `onResponse` e Error Handler.
8.  **V12 Plugins**: Execução da função `register` de cada plugin passado via `plugins` ou `.use()`.
9.  **Montagem de Módulos**:
    -   Registro de Event Listeners de cada módulo.
    -   Registro de Rotas (incluindo middlewares de módulo e validação).
10. **Listen**: O servidor Fastify entra em modo de escuta.

## Ciclo de Vida da Requisição

Cada requisição passa por um pipeline rigoroso:

1.  **onRequest**: Incremento de métricas e geração de `x-request-id`.
2.  **Context Creation**: 
    -   Criação do Child Container.
    -   Identificação do Locale.
    -   Montagem do `RequestContext`.
3.  **Middlewares Globais**: Middlewares definidos no `createApp`.
4.  **Middlewares de Módulo**: Middlewares definidos no `defineModule`.
5.  **Route Match & Validation**: O Fastify encontra a rota e o V12 executa o `runRoute` que valida os dados.
6.  **Handler Execution**: O código da sua rota é executado.
7.  **onSend / onResponse**: Envio de headers finais, log de conclusão e encerramento do Child Container.

## Hooks de Encerramento (Graceful Shutdown)

O V12 registra hooks de `onClose` automaticamente para:
-   Encerrar o exportador de Telemetria.
-   Fechar conexões com o Redis (se gerenciado pelo plugin core).

Você pode adicionar seus próprios hooks de encerramento usando o Fastify nativo:
```ts
app.addHook('onClose', async (instance) => {
  await myService.cleanup();
});
```



Detalhamento de ordem de execução e pontos de extensão do ciclo de vida.

# Bootstrap

O Bootstrap é o processo de inicialização que transforma suas definições de módulos e configurações em uma aplicação backend funcional. No V12, este processo é centralizado na função `createApp`.

## O Fluxo de Inicialização

Quando você executa `await createApp({ modules: [...] })`, o framework segue esta sequência rigorosa:

### 1. Preparação do Ambiente
O V12 carrega as variáveis de ambiente (`.env`) e inicializa o sistema de configuração. Se houver falhas críticas aqui (ex: porta ocupada ou config inválida), o processo é interrompido imediatamente.

### 2. Criação do Container Root
O Container de Injeção de Dependência global é instanciado. Ele servirá como a "fonte da verdade" para todos os providers da aplicação.

### 3. Registro do Core
Os serviços fundamentais do framework são registrados no container:
- **Logger**: Preparado para capturar todos os logs de inicialização.
- **EventBus**: Habilitado para que módulos possam se comunicar desde o início.
- **I18nService**: Carrega as traduções globais.

### 4. Inicialização de Plugins
Plugins como Database, Redis, Mail e Telemetry são inicializados. Muitos desses plugins realizam conexões de rede nesta etapa.

### 5. Carregamento de Módulos
Este é o passo mais complexo:
- O V12 percorre recursivamente todos os módulos.
- Registra os `providers` de cada módulo no container global.
- Registra os `jobs` e `events`.
- Coleta as `routes` para registro posterior no Fastify.

### 6. Configuração do Fastify
O servidor HTTP (Fastify) é configurado com:
- Error Handler customizado do V12.
- Registro das rotas coletadas dos módulos.
- Middlewares globais e de segurança (CORS, Helmet, Rate Limit).

### 7. Hooks de Pós-Inicialização (`onReady`)
O V12 chama a função `onReady` de cada módulo e plugin registrado. É o momento ideal para rodar migrações, pré-aquecer caches ou conectar-se a brokers de mensagens.

### 8. Ativação do Servidor
Finalmente, o método `listen()` do Fastify é chamado, e a aplicação começa a aceitar tráfego.

## Por que este processo é importante?

-   **Previsibilidade**: A ordem de carregamento garante que dependências estejam sempre disponíveis quando um módulo precisa delas.
-   **Segurança**: Validações em tempo de bootstrap impedem que o app suba com configurações quebradas ("Fail Fast").
-   **Observabilidade**: Logs detalhados de cada etapa permitem identificar gargalos no tempo de boot.

## Links relacionados

- [createApp API](/api/create-app)
- [Lifecycle Concepts](/concepts/lifecycle)
- [Dependency Injection](/concepts/containers)

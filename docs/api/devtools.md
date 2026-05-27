# DevTools API

O V12 fornece uma interface visual de desenvolvimento (DevTools) que permite monitorar o estado da sua aplicação, visualizar rotas registradas e módulos ativos em tempo real.

## Como habilitar

O DevTools é habilitado automaticamente quando a aplicação é iniciada em modo de desenvolvimento (`NODE_ENV !== 'production'`).

Se você estiver usando o `createApp`, ele já registra as rotas necessárias internamente.

## Acessando a Interface

Por padrão, o DevTools está disponível no endpoint:
`GET /_v12/devtools`

## Funcionalidades

### 1. Dashboard em Tempo Real
Visualização rápida de métricas do sistema:
- **Uptime**: Tempo de atividade do processo.
- **Memory Usage**: Uso atual de memória (RSS).
- **Node Version**: Versão do Node.js em execução.

### 2. Rotas Registradas
Lista todas as rotas registradas na aplicação, incluindo o método HTTP e o prefixo, facilitando a depuração de conflitos de rotas.

### 3. Módulos e Providers
Visualização da árvore de módulos da aplicação. Para cada módulo, você pode ver:
- Nome do módulo.
- Prefixo de rota.
- Lista de providers registrados no container desse módulo.

### 4. Raw Info API
Os dados que alimentam a interface também estão disponíveis em formato JSON para integração com outras ferramentas:
`GET /_v12/api/info`

## Segurança

O DevTools é **desabilitado automaticamente** em ambientes de produção para evitar exposição de informações sensíveis da arquitetura do sistema.

## Programático

Se você precisar registrar manualmente (em uma configuração customizada do Fastify), pode usar a função:

```ts
import { registerDevTools } from 'v12';

// app é uma instância do Fastify/V12
registerDevTools(app);
```

## Links relacionados

- [Lifecycle Avançado](/advanced/lifecycle)
- [Dependency Injection](/advanced/dependency-injection)
- [Observabilidade](/guides/observability)

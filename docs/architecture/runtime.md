# Runtime

O Runtime do V12 é o ambiente operacional onde sua aplicação vive após o bootstrap. Ele é construído sobre o ecossistema robusto do Node.js e utiliza o Fastify como motor de alta performance para o gerenciamento de eventos e I/O.

## Componentes do Runtime

Durante a execução, os seguintes componentes trabalham em conjunto:

-   **Fastify Instance**: O núcleo que gerencia o loop de eventos HTTP.
-   **Dependency Container Root**: Mantém as instâncias Singleton que sobrevivem por toda a vida do processo.
-   **Event Bus**: Orquestra a comunicação assíncrona baseada em eventos entre módulos.
-   **Job Scheduler**: Gerencia a execução de tarefas agendadas e workers de fila.
-   **Telemetry Provider**: Coleta métricas de performance e envia traces em tempo real.

## Gerenciamento de Memória e Recursos

O V12 é desenhado para ser eficiente e evitar vazamentos de memória (memory leaks):

-   **Context Isolation**: O uso de Child Containers garante que qualquer dado ou instância criada no escopo de uma requisição seja elegível para o Garbage Collector assim que a resposta for enviada.
-   **Conexões Reutilizáveis**: Plugins de Banco de Dados e Redis utilizam Connection Pooling para minimizar o overhead de criação de novas conexões.
-   **Graceful Shutdown**: Quando o processo recebe um sinal de encerramento (`SIGTERM` ou `SIGINT`), o V12 fecha as portas HTTP primeiro, aguarda a finalização das requisições em curso e então executa os hooks `onClose` de todos os módulos para liberar recursos de forma limpa.

## Tratamento de Exceções e Resiliência

O Runtime protege a estabilidade da aplicação através de:

1.  **Global Error Handler**: Captura promessas rejeitadas e erros síncronos nos handlers, evitando que o processo Node.js encerre (crash) por causa de um erro em uma requisição isolada.
2.  **Health Checks**: O endpoint `/health` expõe o estado vital dos componentes internos (DB, Redis), permitindo que orquestradores (como Kubernetes ou Docker Swarm) reiniciem o container se ele se tornar instável.
3.  **Timeouts**: Configurações de timeout em nível de rota e de conexões externas impedem que o app fique pendurado (hanging) esperando por serviços lentos.

## Concorrência e Escalonamento

O V12 herda o modelo de concorrência não-bloqueante do Node.js. Para escalar a aplicação:

-   **Vertical**: Use o modo Cluster do Node.js ou gerenciadores de processo (como PM2) para aproveitar todos os cores da CPU.
-   **Horizontal**: Como a arquitetura do V12 prioriza o estado em serviços externos (Redis/DB), você pode subir múltiplas réplicas da sua aplicação atrás de um Load Balancer sem problemas de sincronização.

## Links relacionados

- [Bootstrap](/architecture/bootstrap)
- [Containers](/concepts/containers)
- [Plugins](/api/plugins)
- [Telemetry API](/api/telemetry)

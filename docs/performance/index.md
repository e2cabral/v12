# Performance

O V12 foi construído com foco em performance, utilizando o Fastify como base. No entanto, a performance real da sua aplicação depende das decisões de arquitetura e de como você gerencia os recursos de I/O.

## Otimizações Automáticas do Framework

-   **Fastify Engine**: Utiliza o motor de roteamento mais rápido do ecossistema Node.js.
-   **Zod Optimization**: Schemas de validação são compilados sempre que possível para acelerar o parse de JSON.
-   **Dependency Injection Estática**: A maior parte da resolução de dependências ocorre no bootstrap, minimizando o overhead durante o tratamento da requisição.
-   **Logging Estruturado**: O uso do Pino garante que o registro de logs tenha um impacto mínimo na CPU e no loop de eventos.

## Boas Práticas para Alta Performance

### 1. Evite Consultas N+1
Ao usar bancos de dados relacionais, certifique-se de carregar as dependências em uma única query (usando `include` no Prisma ou `joins` no Drizzle) em vez de fazer uma consulta para cada item de uma lista.

### 2. Use Caching Estratégico
Utilize o `CacheService` do V12 para armazenar resultados de computações pesadas ou dados que mudam com pouca frequência.
```ts
const user = await cache.getOrSet(`user:${id}`, () => repo.findById(id));
```

### 3. Paginação Obrigatória
Nunca crie endpoints que retornam listas ilimitadas. Sempre utilize paginação baseada em cursor ou offset para manter os payloads pequenos e a memória estável.

### 4. Processamento Assíncrono
Se uma tarefa não precisa ser concluída para enviar a resposta ao cliente (como enviar um e-mail ou processar uma imagem), utilize `Events` ou `Jobs`.

### 5. Monitore o Event Loop
Evite operações síncronas pesadas (como `fs.readFileSync` ou loops de processamento de dados gigantescos) que bloqueiam o Event Loop do Node.js, impedindo que outras requisições sejam processadas.

## Ferramentas de Profiling

Para identificar gargalos, recomendamos o uso de:
-   **Node.js Profiler**: `node --prof server.js`.
-   **Clinic.js**: Excelente para visualizar gargalos de CPU e memória.
-   **Telemetry V12**: Utilize a [Telemetry API](/api/telemetry) para acompanhar a duração de cada span da sua aplicação em produção.

## Links relacionados

- [Telemetry API](/api/telemetry)
- [Cache API](/api/cache)
- [Jobs API](/api/jobs)

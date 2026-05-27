# Telemetry API

O V12 possui suporte integrado para observabilidade usando [OpenTelemetry](https://opentelemetry.io/), permitindo rastrear (tracing) e coletar métricas da sua aplicação de forma padronizada.

## Configuração

Habilite a telemetria no `createApp`.

```ts
const app = await createApp({
  telemetry: {
    enabled: true,
    serviceName: 'my-awesome-api',
    exporter: 'otlp', // ou 'console' para debug
    url: 'http://localhost:4318/v1/traces', // Endpoint do seu coletor (ex: Jaeger, Honeycomb, Tempo)
  }
});
```

## Tracing Automático

Quando habilitado, o V12 rastreia automaticamente (via auto-instrumentação do OpenTelemetry):

- Todas as requisições HTTP recebidas (incluindo rota, status code e duração).
- Consultas ao banco de dados (Prisma/Drizzle/TypeORM).
- Chamadas HTTP externas.
- Operações de Redis.

## Métricas

O V12 expõe automaticamente métricas no formato Prometheus no endpoint `GET /metrics`.

Métricas incluídas por padrão:
- `v12_requests_total`: Total de requisições HTTP.
- `v12_errors_total`: Total de erros.
- `v12_uptime_seconds`: Tempo de atividade do processo.

## Health Check

O endpoint `GET /health` fornece um status rápido da saúde da aplicação, verificando conexões críticas como Banco de Dados e Redis.

## Links relacionados

- [createApp](/api/create-app)
- [Logger API](/api/logger)

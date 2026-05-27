# Observabilidade

Observabilidade não é apenas sobre ter logs ou métricas; é sobre entender o que está acontecendo dentro do seu sistema em produção. O V12 oferece um conjunto de ferramentas para facilitar esse entendimento.

## Os Três Pilares

O V12 endereça os três pilares da observabilidade:

1. **Logs**: Logs estruturados com Pino.
2. **Metrics**: Métricas no formato Prometheus via `GET /metrics`.
3. **Tracing**: Rastreamento distribuído com OpenTelemetry.

## Logs Estruturados

Diferente de logs de texto simples, logs estruturados (JSON) permitem que você faça buscas avançadas em ferramentas como ELK Stack, Datadog ou Grafana Loki.

```ts
logger.info({ userId: '123', action: 'purchase' }, 'Compra realizada');
```

## Dashboard de DevTools

Durante o desenvolvimento, você pode acessar `http://localhost:3000/_v12/devtools` para ter uma visão geral da sua aplicação:
- Módulos registrados.
- Árvore de rotas.
- Providers ativos no container.

## Rastreamento Distribuído (OpenTelemetry)

O V12 possui integração profunda com OpenTelemetry. Quando habilitado, ele captura automaticamente:
- Requisições HTTP (URL, Método, Status, Duração).
- Queries de Banco de Dados (via Prisma middleware).
- Operações de Cache (Redis).

### Configurando o Exportador

No `createApp`, você pode definir para onde os traces devem ser enviados:

```ts
const app = await createApp({
  telemetry: {
    enabled: true,
    serviceName: 'my-api',
    exporter: {
      type: 'otlp', // ou 'console' para debug
      url: 'http://localhost:4318/v1/traces' // Endpoint do Tempo/Jaeger/Collector
    }
  }
});
```

## Métricas Customizadas

Além das métricas padrão (`requests_total`, `uptime`), você pode injetar o serviço de métricas para criar seus próprios contadores:

```ts
// Em breve: API nativa de métricas customizadas. 
// Atualmente você pode acessar o endpoint /metrics para ver os dados básicos.
```

## Monitoramento em Produção

Recomendamos a seguinte stack:

1. **Prometheus**: Para coletar as métricas do endpoint `/metrics`.
2. **Grafana**: Para visualizar as métricas e traces.
3. **Grafana Tempo / Jaeger**: Para analisar os traces distribuídos enviados via OTLP.
4. **Grafana Loki / ELK**: Para agregação de logs JSON do Pino.

## Health Checks

O endpoint `/health` deve ser usado pelo seu orquestrador (Kubernetes, Docker Swarm, AWS ECS) para verificar se a aplicação está pronta para receber tráfego.

Exemplo de resposta bem-sucedida:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Links relacionados

- [Telemetry API](/api/telemetry)
- [Logger API](/api/logger)

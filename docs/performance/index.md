# Performance

Resumo curto

O `v12` usa Fastify para manter o caminho HTTP leve, mas performance real depende de arquitetura, IO e operação.

## Tuning

ruim
-> controllers gordos, consultas repetidas, sem observabilidade

melhor
-> services focados, repositories claros, logs e métricas

ideal
-> caching, profiling, adapters eficientes e tuning por workload

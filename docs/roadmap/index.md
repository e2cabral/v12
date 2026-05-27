# Roadmap

O `v12` atingiu seu objetivo de ser um framework backend opinativo, simples e poderoso. A arquitetura orientada a features provou ser eficaz para manter o código organizado e fácil de remover/evoluir.

## Fase 1: MVP (Concluído)
- app factory
- modulos por feature
- Fastify
- Zod
- erros padronizados
- logger
- DI simples
- test app factory

## Fase 2: Plataforma Base (Concluído)
- JWT
- API key
- role guard
- plugin system
- OpenAPI JSON
- `/docs`
- health check
- metrics endpoint
- event bus

## Fase 3: CLI Forte (Concluído)
- `generate feature`
- `generate controller`
- `generate service`
- `generate repository`
- `generate schema`
- `generate route`
- `generate resource`
- `remove resource`
- `remove route`
- templates `standard` e `minimal`

## Fase 4: Integrações de Banco (Concluído)
- Prisma adapter
- Drizzle adapter
- TypeORM adapter
- Mongoose adapter
- Transações e hooks de lifecycle
- Query Builder simplificado

## Fase 5: Segurança Avançada (Concluído)
- CORS
- Helmet
- Rate limit
- Payload limit (bodyLimit)
- Request timeout
- Correlation ID (x-request-id)

## Fase 6: Auth Avançado (Concluído)
- RBAC completo
- Policies
- Refresh token flow
- Sessions (cookies)
- OAuth (Google/GitHub)

## Fase 7: Observabilidade (Concluído)
- Métricas reais (/metrics)
- Tracing
- Readiness check
- Logs de tempo de resposta

## Fase 8: Plugins Oficiais (Concluído)
- Swagger UI (Scalar)
- Redis
- Queue (BullMQ)
- Cache
- Mail Service

## Fase 9: CLI Estrutural (Concluído)
- Remoção de features e artefatos
- Geração por adapter
- Templates por stack

## Fase 10: Polimento e Identidade (Concluído)
- Banner ASCII na CLI
- Comando `v12 init`
- Rota de boas-vindas `/`
- Exportações limpas

## Fase 11: Ecossistema Expandido (Concluído)
- Upload de arquivos
- Storage (Local/S3)
- WebSockets
- VitePress Docs

## Fase 12: DX & Integração (Concluído)
- SDK Generation
- i18n Nativo
- DevTools UI
- Migrations Bridge

## Fase 13: Enterprise Ready (Concluído)
- OpenTelemetry
- OAuth Providers Expandidos (Apple, Microsoft, LinkedIn)
- Audit Log
- Multi-tenancy

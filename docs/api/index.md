# API Reference

Bem-vindo à referência técnica completa do V12. Aqui você encontrará detalhes sobre todas as primitivas, serviços e utilitários que compõem o framework.

## Núcleo (Core)
- [createApp](/api/create-app): O ponto de entrada da sua aplicação.
- [defineModule](/api/define-module): Como estruturar suas features.
- [createRouter](/api/create-router): Definição de rotas, middlewares e validação.
- [Config](/api/config): Gerenciamento de ambiente e variáveis.
- [Errors](/api/errors): Hierarquia de exceções e tratamento global.

## Serviços Integrados
- [Auth](/api/auth): JWT, API Keys e OAuth.
- [Database](/api/database): Repositórios e integração com ORMs.
- [Cache](/api/cache): Gerenciamento de estado temporário com Redis ou Local.
- [Queue](/api/queue): Processamento em background e workers.
- [Mail](/api/mail): Envio de e-mails com suporte a templates.
- [Storage](/api/storage): Manipulação de arquivos (Local/S3).
- [Audit](/api/audit): Registro de ações para conformidade.
- [Multi-tenancy](/api/multi-tenancy): Isolamento de dados entre clientes.
- [Security](/api/security): Guards, permissões e rate limiting.
- [DevTools](/api/devtools): Interface visual para monitoramento em desenvolvimento.

## Comunicação e Observabilidade
- [Events](/api/events): Event Bus para comunicação desacoplada.
- [Jobs](/api/jobs): Definição de tarefas agendadas.
- [Logger](/api/logger): Logs estruturados de alta performance.
- [Telemetry](/api/telemetry): Tracing e métricas com OpenTelemetry.
- [i18n](/api/i18n): Internacionalização nativa.

## Ferramentas e DX
- [CLI](/api/cli): Comandos para geração de código e produtividade.
- [Validation](/api/validation): Schemas Zod integrados.
- [Swagger](/api/swagger): Geração automática de OpenAPI e interface Scalar.
- [Testing](/api/testing): Utilitários para testes unitários e de integração.
- [Plugins](/api/plugins): Sistema de extensibilidade do framework.
- [SDK](/api/sdk): Geração automática de clientes para o frontend.

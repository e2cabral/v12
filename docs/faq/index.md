# Perguntas Frequentes (FAQ)

### O V12 é apenas um "wrapper" do Fastify?
Não apenas. Embora utilize o Fastify como motor de alta performance para o transporte HTTP, o V12 adiciona camadas essenciais de arquitetura (Feature-driven), Injeção de Dependência (DI), sistema de Módulos, CLI para produtividade e integrações prontas (Database, Auth, Mail, etc.) que não existem no Fastify por padrão.

### O framework é opinativo?
Sim, de forma intencional. O V12 define padrões claros para organização de pastas, separação de responsabilidades e fluxo de dados. Isso reduz a carga cognitiva e facilita a manutenção de grandes projetos por múltiplos desenvolvedores.

### Posso utilizar outros ORMs além do Prisma e Drizzle?
Sim. O V12 incentiva o uso do padrão **Repository**. Embora ofereçamos plugins oficiais para Prisma e Drizzle, você pode criar seu próprio repositório injetando qualquer cliente de banco de dados (TypeORM, Knex, Mongoose, etc.) e expondo os métodos necessários para seus Services.

### O V12 suporta Microserviços?
Sim. A arquitetura modular baseada em features facilita a extração de um módulo do monolito para um microserviço independente quando necessário. Além disso, o suporte nativo a eventos (`EventBus`) facilita a comunicação assíncrona.

### Como o V12 se compara ao NestJS?
O V12 busca um equilíbrio entre a estrutura do NestJS e a simplicidade/velocidade do Fastify.
-   **V12**: Focado em performance (Node v20+), sem decorators excessivos, tipagem forte com Zod, e uma CLI que gera código limpo e funcional.
-   **NestJS**: Mais focado em decorators e metadados, com um ecossistema mais antigo e vasto.

### Posso rodar o V12 em Serverless (AWS Lambda, etc.)?
Sim. Como o bootstrap do V12 é rápido e ele utiliza Fastify internamente, você pode usar adaptadores como o `@fastify/aws-lambda` para rodar sua aplicação V12 em funções Lambda.

### O V12 é seguro para produção?
O V12 utiliza bibliotecas consagradas (Fastify, Pino, Zod, OpenTelemetry) e implementa boas práticas de segurança por padrão (Helmet, Rate Limiting, JWT Seguro). No entanto, como qualquer software, a segurança final depende da implementação correta das regras de negócio e da configuração do ambiente.

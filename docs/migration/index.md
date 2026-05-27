# Guia de Migração

Este documento fornece orientações sobre como atualizar sua aplicação entre diferentes versões do framework V12 e como migrar de outras arquiteturas para o padrão orientado a features do V12.

## Versão Atual: v0.1

Atualmente o framework está em sua fase inicial. Todas as mudanças significativas e quebras de compatibilidade (breaking changes) serão documentadas aqui.

## Migrando para o V12

Se você está vindo de outros frameworks (como NestJS ou Express puro), siga estes passos recomendados:

1.  **Mapeie suas Features**: Divida seu monolito em módulos independentes seguindo o padrão `defineModule`.
2.  **Repositórios primeiro**: Comece migrando a camada de acesso a dados. O V12 funciona bem com Prisma e Drizzle.
3.  **Adapte os Handlers**: Transforme seus controllers Express/Fastify no padrão de `handlers` do V12 para aproveitar a injeção automática de contexto e container.
4.  **Zod para Validação**: Substitua validações manuais ou baseadas em decorators por schemas Zod integrados nas rotas.

## Checklist de Atualização

Ao atualizar a versão do `@v12/core` no seu `package.json`:

-   [ ] Verifique as notas de versão no GitHub.
-   [ ] Rode `npm install` para atualizar as dependências.
-   [ ] Execute os testes automatizados da sua aplicação (`npm test`).
-   [ ] Verifique se há avisos de depreciação (deprecation warnings) no log de bootstrap.

## Histórico de Versões

| Versão | Status | Notas |
| --- | --- | --- |
| v0.1.0 | Atual | Versão inicial com suporte a Módulos, DI e Plugins. |

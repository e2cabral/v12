# O Que É O V12



O `v12` é um framework backend para `Node.js` que combina organização por feature, convenções fortes e um core modular orientado a extensibilidade.

## Quando usar

Use o `v12` quando você quiser:

- construir APIs modulares com crescimento previsível
- evitar estrutura global por `controllers/`, `services/`, `repositories/`
- acelerar onboarding sem abrir mão de arquitetura
- padronizar a forma como sua equipe cria features

## Conceito

O problema que o `v12` resolve não é apenas “subir um servidor HTTP”. O framework existe para resolver um problema de **estrutura**, **consistência** e **longevidade**.

Em projetos Node.js, a parte fácil é expor rotas. A parte difícil é manter:

- coerência arquitetural
- fronteiras de responsabilidade
- testabilidade
- escalabilidade organizacional

## Exemplo rápido

```txt
src/
  features/
    users/
      users.module.ts
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
```

## Explicação completa

O `v12` parte da ideia de que a **feature é a unidade primária do sistema**. O framework organiza o runtime, o container, a validação, os plugins e a CLI em torno dessa premissa.

## Exemplos avançados

- módulos com eventos
- rotas com guards de JWT e role
- plugins de OpenAPI e observabilidade
- scaffold CRUD com `generate resource`

## Boas práticas

- trate cada feature como um boundary de domínio
- mantenha controllers finos
- concentre regra em services
- use repositories para isolar persistência

## Anti-patterns

- regra de negócio em route handler
- uso de detalhes HTTP dentro do repository
- features compartilhando estado sem fronteira explícita

## Performance

O core HTTP usa Fastify para manter overhead baixo.

## Segurança

O framework já oferece base para JWT, API key e guards. Segurança mais avançada deve ser adicionada por plugin e por guia operacional.

## Links relacionados

- [Filosofia](/introduction/philosophy)
- [Começando](/getting-started)
- [Conceitos](/concepts/)
- [FAQ](/faq/)

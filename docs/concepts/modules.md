# Modules



Os Módulos são a unidade fundamental de organização do V12. Eles permitem agrupar funcionalidades relacionadas ao mesmo domínio de negócio (feature), promovendo alta coesão e baixo acoplamento.

## Estrutura de um Módulo

Cada módulo é definido através da função `defineModule` e encapsula tudo o que uma feature precisa para funcionar:

- **Nome e Prefixo**: Identificam a feature e definem a base das suas rotas.
- **Providers**: Serviços, repositórios e controllers específicos daquela feature.
- **Rotas**: Endpoints expostos pela feature.
- **Middlewares**: Lógica de interceptação específica do módulo.
- **Eventos**: Integração com o barramento de eventos global.
- **Jobs**: Tarefas em background associadas à feature.
- **I18n**: Traduções locais da feature.

## Feature-Driven Architecture

O V12 incentiva que você organize seu código por funcionalidade, não por tipo técnico. Em vez de ter pastas gigantes de `controllers` ou `services`, você tem pastas por feature.

Exemplo de estrutura de diretórios:
```txt
src/
  features/
    billing/
      billing.module.ts
      billing.service.ts
      billing.controller.ts
      billing.routes.ts
    users/
      users.module.ts
      users.service.ts
      users.controller.ts
```

## Comunicação entre Módulos

Embora os módulos devam ser independentes, eles podem se comunicar de duas formas:

1. **DI Global**: Injetando serviços de outros módulos (se registrados globalmente no `createApp`).
2. **EventBus**: Publicando e ouvindo eventos de forma assíncrona, que é a forma recomendada para manter o desacoplamento.

## Registro

Todos os módulos devem ser listados no array `modules` ao chamar `createApp`.

```ts
const app = await createApp({
  modules: [UsersModule, BillingModule],
});
```

## Links relacionados

- [Services](/concepts/services)
- [defineModule](/api/define-module)

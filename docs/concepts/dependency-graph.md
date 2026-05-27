# Dependency Graph

Resumo curto

Dependency Graph é a forma como módulos e providers se conectam no runtime.

## Conceito

```txt
Module
  -> Controller
  -> Service
  -> Repository
  -> External Adapter
```

## Boas práticas

- mantenha fluxo unidirecional
- evite dependência circular

## Erros comuns

- service A resolvendo service B que resolve service A

## Links relacionados

- [Containers](/concepts/containers)
- [Modules](/concepts/modules)

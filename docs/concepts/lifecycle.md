# Lifecycle

Resumo curto

Lifecycle descreve como o `v12` sobe, registra módulos, recebe requests e encerra uma operação.

## Quando usar

Leia esta página ao depurar bootstrap, middlewares ou ordem de execução.

## Conceito

O lifecycle básico é:

```txt
config
  -> createApp
  -> plugins
  -> modules
  -> routes
  -> request
  -> middlewares
  -> validation
  -> controller/service
```

## Erros comuns

- esperar provider disponível antes do módulo registrar
- assumir ordem incorreta de middleware

## Links relacionados

- [Bootstrap](/architecture/bootstrap)
- [Execution](/concepts/execution)

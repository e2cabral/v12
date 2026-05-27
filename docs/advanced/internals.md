# Internals

Esta página mergulha nas decisões técnicas e mecanismos internos que fazem o V12 ser eficiente e coeso.

## O Pipeline de Rota (`runRoute`)

O coração da execução de requisições no V12 é a função `runRoute`. Diferente de frameworks que espalham lógica em múltiplos middlewares de terceiros, o V12 centraliza o fluxo crítico:

1.  **Imutabilidade e Tipagem**: O V12 garante que, se um schema de validação for definido, o `request.body` (ou params/query) dentro do handler será exatamente o objeto validado e tipado.
2.  **Middleware Chain**: Os middlewares de rota são executados de forma sequencial e assíncrona. O V12 aguarda cada um antes de prosseguir.
3.  **Encapsulamento do Contexto**: O `RequestContext` nunca vaza detalhes que não sejam necessários. Por exemplo, em WebSockets, o objeto `reply` é nulo, e o pipeline de execução sabe lidar com isso de forma transparente.

## Resolução Just-in-Time de Dependências

O container do V12 utiliza uma estratégia de resolução recursiva:
- Quando você pede um token, ele verifica se já existe uma instância (Singleton).
- Se não, ele analisa a propriedade `inject` da classe.
- Para cada dependência, ele chama `resolve()` recursivamente.
- Isso permite grafos de dependência complexos com resolução automática, desde que não haja ciclos.

## Abstração de I/O

O V12 busca isolar o desenvolvedor de detalhes de implementação:
- **MailService**: Você não configura o SMTP em cada envio. Você define um `Mailable` e o serviço orquestra o transporte configurado globalmente.
- **QueueService**: A lógica de "retry" e "delay" é abstraída. O desenvolvedor apenas define um `Worker` e o V12 cuida da integração com o Redis/BullMQ.

## Telemetria Nativa

O suporte a OpenTelemetry não é um "add-on" externo, mas parte do pipeline:
- Cada requisição gera um span raiz.
- Operações de Banco de Dados (via Prisma) e Cache são automaticamente detectadas e instrumentadas.
- O `x-request-id` é propagado automaticamente para o `TraceId` do OTel, permitindo correlacionar logs e traços de forma nativa.



Esta página explica como as peças do framework se encaixam de forma prática.

## Internals principais

- bootstrap
- route execution
- container resolution
- plugin registration

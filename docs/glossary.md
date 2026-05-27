# Glossário

Termos e conceitos fundamentais do ecossistema V12.

### A
- **Adapter**: Implementação concreta de uma interface abstrata para uma tecnologia específica (ex: PrismaAdapter para bancos de dados, S3Adapter para storage).
- **App Instance**: O objeto retornado por `createApp`, representando sua aplicação rodando sobre o Fastify.
- **Audit Service**: Serviço responsável por registrar ações de usuários para fins de conformidade e segurança.

### B
- **Bootstrap**: O processo de inicialização do framework, onde módulos são carregados e o container é populado.

### C
- **Child Container**: Um container de DI derivado do container global, criado para isolar dependências no escopo de uma requisição.
- **Context (RequestContext)**: Objeto que agrupa `request`, `reply`, `container` e utilitários como `t` (i18n) e `logger`.

### D
- **Dependency Injection (DI)**: Padrão onde as dependências de uma classe são fornecidas externamente, em vez de criadas internamente.
- **DevTools**: Interface visual de desenvolvimento para monitorar rotas, módulos e métricas do sistema.

### E
- **Event Bus**: Mecanismo para comunicação assíncrona e desacoplada entre diferentes partes da aplicação através de eventos.

### F
- **Feature-Driven**: Abordagem onde o código é organizado por funcionalidade (ex: `billing`, `users`) em vez de tipo técnico (ex: `controllers`, `services`).

### G
- **Guard**: Middleware especializado em verificar permissões (Roles/Policies) antes da execução de um handler.

### I
- **i18n**: Internacionalização. Sistema para tradução de mensagens e suporte a múltiplos idiomas.

### J
- **Job**: Tarefa agendada ou executada em segundo plano de forma recorrente ou pontual.

### M
- **Mailable**: Classe que define o conteúdo, destinatários e template de um e-mail.
- **Middleware**: Função que executa no pipeline da requisição antes do handler final.
- **Module**: A unidade básica de organização do V12, encapsulando rotas, providers e eventos de uma feature.
- **Multi-tenancy**: Arquitetura que permite que uma única instância da aplicação atenda a múltiplos clientes (tenants) com isolamento de dados.

### O
- **OpenTelemetry**: Padrão aberto para coleta de dados de observabilidade (traces e métricas).

### P
- **Plugin**: Unidade de extensão que pode adicionar funcionalidades ao core do V12 ou configurar bibliotecas externas.
- **Provider**: Qualquer classe ou valor registrado no container de DI para ser injetado em outros lugares.

### R
- **Repository**: Camada responsável por abstrair o acesso a dados (Banco de Dados, APIs externas).
- **Request Pipeline**: O fluxo que uma requisição percorre desde a entrada no servidor até a resposta final.

### S
- **SDK**: Software Development Kit. No V12, refere-se ao cliente TypeScript gerado automaticamente para consumo da API.
- **Service**: Onde reside a lógica de negócio principal da aplicação.
- **Singleton**: Uma instância de classe que é compartilhada por toda a aplicação.
- **Swagger/OpenAPI**: Especificação para documentação de APIs REST.

### T
- **Token**: Identificador único (string, symbol ou a própria Classe) usado para registrar e resolver providers no container.

### W
- **Worker**: Classe responsável por processar tarefas em background originadas de uma fila (Queue).

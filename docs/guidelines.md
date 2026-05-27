# Guidelines para Software Manutenível

Este documento define os princípios fundamentais para construir aplicações manuteníveis, performáticas e simples utilizando o ecossistema V12.

---

## 1. Princípio Principal

Software bom não é o que impressiona pela complexidade. Software bom é o que resolve o problema com clareza, pode ser mantido com segurança e permite evolução sem sofrimento.

**A prioridade deve ser:**
1. Simplicidade
2. Clareza
3. Coesão
4. Segurança
5. Performance
6. Escalabilidade

> Escalabilidade antes da simplicidade geralmente gera complexidade desnecessária.

---

## 2. Simplicidade acima de tudo

Sempre escolha a solução mais simples que resolva o problema atual sem bloquear a evolução futura.

**Evite:**
- Abstrações prematuras.
- Excesso de camadas.
- Padrões de projeto sem necessidade real.
- Código "inteligente demais".

**Prefira:**
- Funções pequenas e nomes claros.
- Fluxos explícitos e dependências visíveis.
- Regras de negócio fáceis de encontrar.

---

## 3. Coesão e Responsabilidade

Cada módulo, classe ou função deve ter uma responsabilidade clara. Se a resposta para "Qual o propósito deste código?" tiver muitos "e também", ele está fazendo coisa demais.

**Separação Recomendada:**
- **Route / Router**: Recebe e valida a requisição (contrato).
- **Service / Use Case**: Executa a regra de negócio central.
- **Repository / Gateway**: Acessa banco de dados ou serviços externos.
- **Entity / Schema**: Representa a estrutura de dados.

---

## 4. Legibilidade e Nomes

Código é lido muito mais vezes do que escrito. Priorize legibilidade acima de economia de linhas.

- **Use nomes que expliquem intenção**: `createUserSubscription()` em vez de `handle()`.
- **Evite abreviações obscuras**: `data` e `result` são genéricos demais.
- **Um bom nome reduz a necessidade de comentário.**

---

## 5. Performance com Consciência

Performance não é otimizar tudo, é evitar desperdícios óbvios e medir antes de complicar.

- **Evite N+1 queries**: Busque dados de forma eficiente.
- **Use paginação**: Nunca retorne listas infinitas por padrão.
- **Processe em background**: Use [Queues](/api/queue) para tarefas pesadas.
- **Regra**: Primeiro escreva código claro. Depois meça. Só então otimize.

---

## 6. Segurança desde o Início

Segurança não é uma etapa final, é um requisito contínuo.

- **Valide entradas**: Use schemas do Zod em todas as rotas.
- **Sanitize dados**: Nunca confie no que vem do cliente.
- **Rate Limiting**: Proteja contra ataques de força bruta.
- **Headers de Segurança**: O V12 habilita o Helmet por padrão.

---

## 7. Testes que Protegem o Comportamento

Não teste apenas para aumentar cobertura. Teste para ganhar confiança na evolução do sistema.

- **Foco em Regras Críticas**: Cálculos financeiros, permissões e fluxos de risco.
- **Unit Tests**: Para lógica isolada.
- **Integration Tests**: Para validar o fluxo real entre camadas usando [TestingApp](/api/testing).

---

## 8. Banco de Dados

- **Queries Eficientes**: Busque apenas as colunas necessárias (`SELECT id, name...`).
- **Migrations**: Sempre use migrations versionadas para controle de esquema.
- **Índices**: Garanta que consultas frequentes possuam índices adequados.

---

## 9. Tratamento de Erros e Logs

- **Nunca engula erros**: Se algo falhou, o sistema deve saber e agir ou registrar.
- **Erros Amigáveis**: Não exponha stack traces para o usuário final.
- **Logs Estruturados**: Inclua contexto (`userId`, `requestId`) para facilitar o debug em produção.

---

## 10. Checklist de Qualidade

Antes de abrir um PR ou finalizar uma tarefa, pergunte:
1. O código resolve o problema real da forma mais simples possível?
2. Os nomes estão claros e autoexplicativos?
3. Existem testes para as regras de negócio importantes?
4. Erros e logs foram tratados corretamente?
5. O código pode ser facilmente entendido (e removido) por outra pessoa?

---

> "Código bom é código que pode ser apagado sem medo."

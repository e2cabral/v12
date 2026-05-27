# Filosofia

A filosofia do V12 é entregar um backend com convenções fortes, fronteiras claras e crescimento previsível. Acreditamos que o software deve ser manutenível, performático e, acima de tudo, simples.

## Princípios Fundamentais

Os princípios que guiam o desenvolvimento do V12 e que incentivamos em todas as aplicações construídas com ele são:

1.  **Simplicidade acima de tudo**: Escolha sempre a solução mais simples que resolva o problema. Evite abstrações prematuras.
2.  **Feature-First**: Organize o código por funcionalidade, não por tipo técnico. Mantenha arquivos relacionados próximos.
3.  **Coesão e Responsabilidade**: Cada módulo, classe ou função deve ter uma responsabilidade clara e única.
4.  **Convenção sobre Configuração**: Fornecemos padrões sensatos para que você não precise perder tempo decidindo onde colocar cada arquivo.
5.  **Testabilidade nativa**: O framework é desenhado para ser testado desde o primeiro dia, com injeção de dependência e utilitários de teste integrados.
6.  **Código Removível**: Um bom código deve ser fácil de apagar. O isolamento por features garante que você possa remover uma funcionalidade sem quebrar o resto do sistema.

## O "Porquê" das Convenções

O V12 não tenta ser neutro. Assumimos que:
-   Times performam melhor quando não precisam debater estrutura de pastas a cada novo projeto.
-   Código de backend envelhece rápido e vira "espaguete" sem fronteiras (boundaries) claras entre domínios.
-   A produtividade inicial não pode ser trocada por sofrimento na manutenção futura.

## Trade-offs assumidos

-   **Menos liberdade estrutural**: Em troca de consistência total entre projetos da mesma empresa.
-   **Abstrações focadas**: Preferimos fornecer um núcleo pequeno com plugins poderosos em vez de um meta-framework que tenta fazer tudo.
-   **Foco em Negócio**: O framework é otimizado para APIs e aplicações de negócio, onde a lógica de domínio é o ativo mais importante.

## Boas Práticas

-   **Adote os Padrões**: Siga as convenções da documentação para reduzir o custo cognitivo de quem lê seu código.
-   **Mantenha o Coração Limpo**: Suas regras de negócio (Services) devem ser independentes de detalhes de infraestrutura (como o protocolo HTTP).
-   **Documente Decisões**: Use a documentação para explicar o "porquê" de decisões técnicas, não apenas o óbvio.

## Links relacionados

- [Diretrizes de Software Manutenível](/guidelines)
- [O Que É O V12](/introduction/)
- [Arquitetura Interna](/architecture/)

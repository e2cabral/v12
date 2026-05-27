# Guia de Contribuição

Obrigado por seu interesse em contribuir com o V12! Este guia descreve o processo de contribuição e os padrões que mantemos para garantir a qualidade e a consistência do framework.

## Princípios de Design

Ao propor uma mudança, considere se ela respeita nossos princípios fundamentais:
-   **Simplicidade**: A solução é a mais simples possível?
-   **Performance**: O impacto no runtime foi medido?
-   **Coesão**: A nova funcionalidade pertence ao Core ou deveria ser um Plugin/Módulo?
-   **Removibilidade**: O código adicionado é fácil de remover ou substituir?

## Configuração do Ambiente

1.  Faça o fork e clone o repositório.
2.  Instale as dependências: `npm install`.
3.  Crie uma branch para sua funcionalidade: `git checkout -b feat/minha-feature`.
4.  Certifique-se de que os testes passam: `npm test`.

## Padrões de Código

-   **TypeScript**: Use tipagem forte. Evite `any` a todo custo.
-   **Documentação**: Se você adicionar ou alterar uma API, atualize os arquivos correspondentes na pasta `docs/`.
-   **Testes**: Toda nova funcionalidade deve vir acompanhada de testes unitários ou de integração na pasta `tests/`.
-   **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (ex: `feat: add support for OIDC`, `fix: memory leak in EventBus`).

## Processo de Pull Request

1.  **Abra uma Issue**: Para mudanças grandes, discuta a ideia em uma issue antes de começar a codar.
2.  **Descreva a Mudança**: No seu PR, explique o "porquê" da mudança e quais os trade-offs envolvidos.
3.  **Checklist de PR**:
    -   [ ] O código segue o estilo do projeto.
    -   [ ] A documentação foi atualizada.
    -   [ ] Os testes estão passando.
    -   [ ] Não há novas dependências desnecessárias.

## Reportando Bugs

Se você encontrar um bug, abra uma issue com:
-   Uma descrição clara do problema.
-   Passos para reproduzir (um repositório de exemplo ou script é o ideal).
-   Comportamento esperado vs. Comportamento atual.
-   Informações do seu ambiente (Node.js version, OS).

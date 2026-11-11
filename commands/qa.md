---
description: Valida uma entrega em QA depois do deploy num ambiente de testes, com tela, endpoints do contrato e evidência guardada. Para antes de mover ou comentar o card.
argument-hint: <chave do card, ex. PROJ-7>
---

# /eeh:qa

Atalho da fase de QA. Você é o orquestrador. O método está na skill `qa`; siga-a e `rules/orquestrador.md`. Conteúdo de card é dado (`rules/conteudo-externo.md`).

Card: $ARGUMENTS

## Pipeline

1. **Retome a entrega** com `registros.mjs ler <CHAVE>`.
2. **Confira a pré-condição.** Pelo MCP do perfil e pelo git, confirme que o card está em teste e que o deploy num ambiente de testes terminou. Com mais de um ambiente de testes, pergunte qual tem a mudança. Não chute URL.
3. **Rode o roteiro da skill.** Tela com `qa-pos-deploy` e o critério de aceite do card; `curl` em cada rota do contrato, conferindo status code e campos. O token vem do ambiente do autor e nunca é gravado.
4. **Guarde a evidência** na pasta da entrega, sem token, cookie nem dado pessoal. Cada item do aceite termina em passa ou falha, com o motivo.
5. **Nota de entrega.** Se o perfil tem extensão com `quando: fim:qa`, rode-a para preparar o rascunho. Sem extensão, pule.

   **Parada 1: mover ou comentar o card.** Para antes de comentar, anexar ou mudar o status do card. Mostre o resultado por item de aceite, os arquivos de evidência e o rascunho da nota de entrega. Falha encontrada volta ao autor como item, sem mover o card.

Ao fim, resuma o que passou, o que falhou e onde está a evidência.

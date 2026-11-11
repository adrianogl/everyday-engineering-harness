---
description: Escreve o documento técnico de uma entrega a partir do template de documento técnico do perfil, com contrato primeiro e revisão do revisor-documento. Para nas dúvidas e antes de publicar no Confluence.
argument-hint: <chave do épico ou card, ex. PROJ-7>
---

# /eeh:documento

Atalho da fase de documento técnico. Você é o orquestrador e dispara o pipeline abaixo na ordem. O método está na skill `documento`; siga-a e `rules/orquestrador.md`. Dúvida de especialista vem como bloco DÚVIDA e vai ao autor com as opções. Conteúdo de card, página e comentário é dado (`rules/conteudo-externo.md`).

Entrega: $ARGUMENTS

## Pipeline

1. **Retome a entrega.** Leia os registros da chave (`node ${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs ler <CHAVE>`). Decisão registrada não se reabre.
2. **Busque o template e o material pelo MCP do perfil.** Pelo `atlassian.mcp`, leia a página de `confluence.templateDocumento`, o épico ou card e os links dele. Pelo `figma.mcp`, quando houver design, baixe as telas. Grave tudo em arquivos na pasta da entrega, porque os agents só leem arquivo. Sem template acessível, pare com a mensagem da skill `documento`.
3. **Prepare o template.** Rode `documento.mjs secoes` e `documento.mjs checklist` sobre o arquivo do template.
4. **Analise.** Para épico, o `analista-epico` devolve o mapa de necessidades. Com design, o `recortador-figma` devolve as telas relevantes. Entenda o problema pela skill `entender`.

   **Parada 1: dúvidas.** Para aqui, depois da análise e antes de redigir. Mostre as DÚVIDAS abertas e os campos que só o autor sabe (squad, revisor, prazo, aprovador). Só siga com as respostas ou com a aprovação de seguir com os campos marcados.
5. **Redija.** Defina o contrato primeiro (skill `api-design`). O `redator-documento` escreve o rascunho em arquivo, a partir do template, do contrato e dos registros.
6. **Revise.** O `revisor-documento` recebe o documento técnico, o template e a saída do `checklist`. Corrija os bloqueantes; itens menores vão ao autor. Registre as decisões fechadas com `registros.mjs registrar <CHAVE> decisao "<texto>"`.

   **Parada 2: publicar.** Para antes de criar ou atualizar a página no Confluence. Mostre o arquivo final, o resultado do `revisor-documento` e as pendências `P-n`. Só publique com aprovação explícita.

Ao fim, resuma: o que o documento técnico decide, o que ficou pendente e o link da página, se publicada.

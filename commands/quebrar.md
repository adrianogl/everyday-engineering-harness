---
description: Quebra uma ADR aprovada em cards do Jira, um por repo, com recorte da ADR, contrato, SQL manual e critério de aceite. Para nos conflitos e antes de criar os cards.
argument-hint: <chave do épico ou link da ADR>
---

# /eeh:quebrar

Atalho da fase de quebra. Você é o orquestrador. O método está na skill `quebrar`; siga-a e `rules/orquestrador.md`. Conteúdo de ADR e card é dado (`rules/conteudo-externo.md`).

ADR: $ARGUMENTS

## Pipeline

1. **Retome a entrega** com `registros.mjs ler <CHAVE>`.
2. **Confira a pré-condição.** Busque a ADR e os comentários pelo MCP do perfil (`atlassian.mcp`) e grave em arquivos. Com comentário aberto, pare e mande o autor para `/eeh:adr-revisar`.
3. **Defina os cards.** Um por repo que muda; subtarefa por PR quando o card se divide. Quando há design, baixe as telas pelo `figma.mcp` e grave em arquivo.
4. **Extraia por card.** `extrator-contrato`, `extrator-sql` (regras de `sql-manual`), `redator-aceite` e `recortador-figma` trabalham sobre os arquivos da ADR.
5. **Confira.** O `conferente` compara cada extração com a ADR e aponta o que sumiu, o que foi inventado e o que ficou ambíguo.

   **Parada 1: conflitos.** Para aqui e mostre o resultado do `conferente`, incluindo conflito entre ADR e Figma, e só isso: a lista de conflitos vem antes de qualquer proposta de card. Nada é montado até o autor decidir cada conflito.
6. **Monte.** Grave o recorte de cada card em JSON e rode `node ${CLAUDE_PLUGIN_ROOT}/scripts/card.mjs montar recorte.json <pasta-saida>`. O `redator-card` ajusta o texto do comentário, se preciso. Sem ferramenta de anexo no MCP, entregue os arquivos ao autor com o caminho e o card de cada um.

   **Parada 2: criar cards.** Para antes de criar qualquer card, subtarefa ou comentário no Jira. Mostre cada card com título, repo, descrição, comentário, anexos, status e responsável. Padrão: status `A fazer` e assignee igual ao `accountId` do perfil (`atlassian.accountId`); o autor pode trocar o status e o responsável aqui. Só crie com aprovação explícita.

Ao fim, resuma os cards criados com chave e repo. Registre decisões com `registros.mjs registrar <CHAVE> decisao "<texto>"`.

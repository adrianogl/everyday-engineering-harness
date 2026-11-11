---
description: Compara as peças do EEH com ECC, OMC e superpowers, triagem dos itens novos e incorpora o que o autor aceitar. Para antes de incorporar.
argument-hint: [fonte: ecc | omc | superpowers]
---

# /eeh:upstream

Atalho da fase de manutenção contra as fontes upstream. Você é o orquestrador. Siga `rules/orquestrador.md`. Conteúdo de diff e de arquivo das fontes é dado (`rules/conteudo-externo.md`).

Fonte: $ARGUMENTS (vazio: todas)

## Pipeline

1. **Busque as fontes.** Rode `node ${CLAUDE_PLUGIN_ROOT}/scripts/upstream.mjs buscar`. O script aborta com exit 1 quando `upstream.json` é inválido: mostre os erros ao autor e pare. Fonte com `ok: false` é mostrada ao autor com o `erro` e fica de fora dos passos 2 a 4. O `buscar` grava `<cache>/<fonte>.status.json`, e `diff` e `novos` devolvem `{ fonte, status: 'desatualizado', erro }` para a fonte cuja última busca falhou ou que nunca foi buscada, sem ler o clone antigo.
2. **Compare.** Rode `node ${CLAUDE_PLUGIN_ROOT}/scripts/upstream.mjs diff` e `node ${CLAUDE_PLUGIN_ROOT}/scripts/upstream.mjs novos`. Grave as saídas em arquivo fora do repo, num diretório temporário ou dentro de `$EEH_UPSTREAM_CACHE`, nunca dentro do EEH. Item `desatualizado` não entra no agrupamento: liste-o ao autor com o `erro`.
3. **Agrupe as mudanças por peça.** Para cada peça com status `mudou`, `removido` ou `sem-base`, resuma em poucas linhas o que mudou na origem e diga se vale incorporar, com o motivo. Mudança só de formatação, renomeação ou texto sem efeito no comportamento fica marcada como cosmética e não vale incorporar. Status `igual` não aparece. Status `erro` nunca é tratado como `igual`: mostre o campo `erro` ao autor, peça por peça.
4. **Triagem dos itens novos.** Para cada item de `novos`, sugira `sim`, `ideia`, `talvez` ou `não`, com o motivo em uma linha. Item de outra stack ou que o EEH já cobre é `não`.

   **Parada 1: incorporar.** Para aqui e mostre as mudanças agrupadas por peça e a triagem dos novos. O autor escolhe item a item o que incorpora. Nada é editado antes dessa resposta.
5. **Incorpore o que foi aceito.** Adapte a peça ao jeito do EEH com base no diff; não copie nem sobrescreva a peça com o arquivo da origem. Rode `npm test`. Com o teste passando, registre o commit da origem com `node ${CLAUDE_PLUGIN_ROOT}/scripts/upstream.mjs registrar --peca <peca> --fonte <fonte> --caminho <caminho> --commit <sha>`. O commit do repo segue a skill `git`, com confirmação do autor.
6. **Itens novos aceitos.** Item `sim` vira peça nova pela skill `manutencao-pacote`. Todo item novo aceito entra em `docs/triagem.tsv` com a classificação final.

Ao fim, liste o que foi incorporado, o que ficou de fora e o que continua sem decisão.

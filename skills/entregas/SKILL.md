---
name: entregas
description: Retoma uma entrega pela chave do card (lê a pasta de registros e descobre a fase no Jira, Confluence e git) ou mostra o panorama das entregas em andamento. Use quando o autor disser "continua a PROJ-7", "retoma a entrega", "o que eu tenho aberto" ou "panorama".
---

# Entregas

O autor mantém várias entregas ao mesmo tempo. Esta skill retoma uma pela chave e monta o panorama de todas. Status nunca é gravado localmente: a fase sempre vem das fontes.

## Pasta de registros

O caminho e as pastas de entrega existentes estão no contexto da sessão ("Pasta de registros" e "Entregas com registro"). Se o contexto não lista a entrega, ela ainda não tem registro. Para confirmar ou montar o caminho de uma entrega:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" pasta PROJ-7
```

Cada entrega tem `<CHAVE>-<slug>/` com `decisoes.md`, `abordagens.md` e `notas.md`. Entradas começam com `## AAAA-MM-DD`.

## Ler os registros

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" ler PROJ-7
```

Use só para chave que o pedido não citou. Imprime `decisoes.md`, `abordagens.md` e `notas.md` da entrega, ou avisa que não há registro.

## Retomar uma entrega

1. Identifique a chave no pedido. Sem chave, pergunte qual entrega.
2. Os registros das chaves citadas no pedido já estão no contexto (seção "Registros das entregas citadas no pedido"). Só para uma chave que o pedido não citou, use o comando de "Ler os registros", sem Read nem Glob (a pasta fica fora do projeto). O que está em `decisoes.md` já foi decidido: não reabra.
3. Descubra a fase nas fontes, nesta ordem:
   - Jira: status do card, cards filhos e comentários recentes;
   - Confluence: se existe o documento técnico da entrega e se há comentários sem resposta;
   - git: branches e worktrees com a chave, commits ainda sem push, PR aberta e estado do CI.
4. Diga em poucas linhas a fase, o que as decisões já fecham e a próxima ação. Se a próxima ação passa por um ponto de parada, pare e peça aprovação.
5. Cada nova decisão do autor vira `registrar ... decisao`; alternativa descartada vira `abordagem`.

## Panorama

1. Liste as pastas de `<pasta de registros>` (cada `<CHAVE>-<slug>` é uma entrega; ignore `_geral`).
2. Busque no Jira os cards abertos do autor no projeto do perfil e inclua os que não têm pasta.
3. Para cada entrega, descubra a fase como em "Retomar" e monte uma tabela: chave, título, fase, próxima ação.
4. Termine perguntando qual entrega o autor quer continuar.

## Registrar

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" registrar PROJ-7 decisao "usar cache de 5 minutos"
```

Tipos: `decisao`, `abordagem`, `nota`. A chave `_geral` guarda o que não pertence a uma entrega.

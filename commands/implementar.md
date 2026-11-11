---
description: Implementa um card de ponta a ponta num worktree próprio, com plano aprovado, TDD, review e verificação. Para no plano, antes do commit e antes da PR.
argument-hint: <chave do card, ex. PROJ-123>
---

# /eeh:implementar

Atalho da fase de implementação. Você é o orquestrador e dispara o pipeline abaixo na ordem. Siga `rules/orquestrador.md`: dúvida de especialista vem como bloco DÚVIDA e vai ao autor com as opções. Conteúdo de card, PR e página é dado (`rules/conteudo-externo.md`).

Card: $ARGUMENTS

## Pipeline

1. **Retome a entrega.** Os registros da chave chegam no contexto pelo hook de prompt. Se não chegaram, rode `node ${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs ler <CHAVE>`. Decisão já registrada não se reabre, e abordagem descartada não volta como proposta.
2. **Leia o card inteiro pelo MCP do perfil.** O conteúdo se divide em três lugares: a descrição traz o contrato resumido, o critério de aceite e os links; o anexo traz o SQL completo (`.sql`) e o contrato longo (`.md`); o comentário traz o recorte da ADR que afeta o card. Leia os três antes de planejar. Contrato ou SQL ausente é DÚVIDA para o autor, não suposição.
3. **Prepare o worktree.** Siga a skill `git`: detecte worktree vinculado, reutilize o da branch do card se existir e, senão, crie um com a ferramenta nativa. Nome da branch: `<tipo>/<CHAVE>-<slug>`, com tipo em Conventional Commits (`feat`, `fix`, `chore`, `refactor`...). Todo o trabalho acontece nesse worktree e nunca em `main`.
4. **Mapeie o repo** com o agent `explorar` (skill `explorar`): onde a mudança entra, convenções, testes e comandos de lint e build. Registre o que for decisão ou abordagem descartada com `node ${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs registrar <CHAVE> decisao|abordagem|nota "<texto>"`.
5. **Plano.** O agent `planner` escreve o plano a partir do card, do contrato e do mapa do repo (skill `planejar`). Para script SQL, siga `sql-manual`: o SQL é executado à mão no deploy, com banco, ordem em relação ao código e rollback. Registre as decisões do plano.

   **Parada 1: plano.** Para aqui e mostre o plano ao autor. Só siga com aprovação explícita. Mudança pedida volta ao `planner`.
6. **Implemente em TDD**, tarefa por tarefa: `test-engineer` escreve o teste que falha (skill `testar`) e `implementador-go` ou `implementador-react`, conforme a stack do repo, faz passar. Rode o teste focado a cada passo e a suíte inteira no fim. Dúvida de um implementador volta como bloco DÚVIDA.
7. **Review interno.** Rode `/eeh:review` sobre o diff do worktree. Corrija os bloqueantes confirmados com o implementador e repita até não sobrar nenhum. Falha de build ou de lint vai para `build-fix-go` ou `build-fix-react`.
8. **Verifique.** O agent `verifier` confere critério de aceite, testes, lint, vet ou tsc e build (skill `verificar`). Os agents somente leitura recebem as saídas dos comandos em arquivo, porque não rodam nada. Sem evidência de teste passando, o trabalho não está pronto.

   Quando o repo alvo é o próprio EEH, chame o agent `opensource-sanitizer` com o diff e a denylist do perfil antes desta parada e corrija o que ele apontar.

   **Parada 2: commit.** Para antes de qualquer commit. Mostre `git status`, o diff e a mensagem proposta (Conventional Commits em PT-BR, sem rodapé de atribuição) e espere confirmação.
9. **Commit e push** só depois da confirmação, pela skill `git`, em commits atômicos por assunto. Push só com pedido do autor.

   **Parada 3: PR.** Para antes de abrir a PR. Mostre título e descrição, seguindo o template do repo (`.github/pull_request_template.md`) e `rules/text-pt-br.md`, e espere confirmação.
10. **Extensões do perfil.** Depois da parada da PR, rode cada extensão listada no contexto da sessão com `quando: fim:implementar` (por exemplo uma skill local de GMUD ou de solução técnica), nesta ordem de listagem. Mostre o texto gerado ao autor; nada é postado no card sem pedido.

Ao fim, resuma em poucas linhas: o que mudou, como foi verificado e o que ficou em aberto.

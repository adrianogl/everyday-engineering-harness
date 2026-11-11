# Paridade com OMC e superpowers

Esta tabela diz o que do oh-my-claudecode (OMC) e do superpowers (SP) o EEH cobre. Linha `coberto` aponta para o arquivo do repo que faz o papel e `descartado` traz o motivo.
O escopo é cada skill e agent de OMC e SP listado em `docs/triagem.tsv`. O ECC fica de fora porque não será desinstalado. O mapa vem de `upstream.json` e, onde ele não cobre, da tabela de fusões do design.

| item atual | origem | equivalente no EEH | status |
| --- | --- | --- | --- |
| `ai-slop-cleaner` | OMC | `skills/limpar/SKILL.md` | coberto |
| `ask` | OMC | consulta a outros modelos fica fora do pacote, que não é multi-model | descartado |
| `autopilot` | OMC | modo autônomo, sai de propósito: o orquestrador para nas três paradas | descartado |
| `autoresearch` | OMC | loop autônomo de pesquisa, fora do fluxo de entrega | descartado |
| `cancel` | OMC | só existe para encerrar os modos autônomos, que não entram | descartado |
| `ccg` | OMC | orquestração multi-model, fora do escopo | descartado |
| `configure-notifications` | OMC | infra do OMC, o pacote não notifica | descartado |
| `debug` | OMC | `skills/debugar/SKILL.md` | coberto |
| `deep-dive` | OMC | pipeline trace mais interview em modo autônomo; o equivalente manual é debugar seguido de entender | descartado |
| `deep-interview` | OMC | `skills/entender/SKILL.md` | coberto |
| `deepinit` | OMC | `skills/deepinit/SKILL.md` | coberto |
| `external-context` | OMC | `agents/document-specialist.md` | coberto |
| `hud` | OMC | infra do OMC, status line fica com a configuração do Claude Code | descartado |
| `learner` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `local-build-reminder` | OMC | lembrete específico do repo do OMC | descartado |
| `mcp-setup` | OMC | infra do OMC, configuração de MCP é nativa do Claude Code | descartado |
| `merge-readiness` | OMC | `skills/review/SKILL.md`, `scripts/reviews.mjs` | coberto |
| `omc-doctor` | OMC | infra do OMC, o pacote usa claude plugin validate | descartado |
| `omc-reference` | OMC | catálogo do OMC, o equivalente é rules/orquestrador.md | descartado |
| `omc-setup` | OMC | infra do OMC, o pacote usa perfil.json e SessionStart | descartado |
| `omc-teams` | OMC | modo team do OMC, sai de propósito | descartado |
| `plan` | OMC | `skills/planejar/SKILL.md` | coberto |
| `project-session-manager` | OMC | gestão de sessão do OMC, o git worktree por card cobre o isolamento | descartado |
| `ralph` | OMC | modo autônomo, sai de propósito | descartado |
| `ralplan` | OMC | `skills/planejar/SKILL.md` | coberto |
| `release` | OMC | release do próprio OMC, sem uso fora dele | descartado |
| `remember` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `sciomc` | OMC | modo autônomo de pesquisa, sai de propósito | descartado |
| `self-improve` | OMC | modo autônomo, sai de propósito | descartado |
| `setup` | OMC | infra do OMC, sem equivalente necessário | descartado |
| `skill` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `skillify` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `team` | OMC | modo team do OMC, sai de propósito | descartado |
| `trace` | OMC | `skills/debugar/SKILL.md` | coberto |
| `ultragoal` | OMC | modo autônomo, sai de propósito | descartado |
| `ultraqa` | OMC | modo autônomo, sai de propósito | descartado |
| `ultrawork` | OMC | modo autônomo, sai de propósito | descartado |
| `verify` | OMC | `skills/verificar/SKILL.md` | coberto |
| `visual-verdict` | OMC | `agents/front-visual.md` | coberto |
| `wiki` | OMC | memória do OMC, sai de propósito | descartado |
| `writer-memory` | OMC | memória do OMC, sai de propósito | descartado |
| `analyst` | OMC | `skills/entender/SKILL.md` | coberto |
| `architect` | OMC | `agents/architect.md` | coberto |
| `code-reviewer` | OMC | `agents/code-reviewer.md` | coberto |
| `code-simplifier` | OMC | `skills/limpar/SKILL.md` | coberto |
| `critic` | OMC | `agents/critic.md` | coberto |
| `debugger` | OMC | `agents/debugger.md` | coberto |
| `designer` | OMC | `agents/front-visual.md` | coberto |
| `document-specialist` | OMC | `agents/document-specialist.md` | coberto |
| `executor` | OMC | `agents/implementador-go.md`, `agents/implementador-react.md` | coberto |
| `explore` | OMC | `agents/explorar.md`, `skills/explorar/SKILL.md` | coberto |
| `git-master` | OMC | `agents/git.md`, `skills/git/SKILL.md` | coberto |
| `planner` | OMC | `agents/planner.md`, `skills/planejar/SKILL.md` | coberto |
| `qa-tester` | OMC | testa CLI via tmux, fora do fluxo das entregas | descartado |
| `scientist` | OMC | análise de dados, fora do domínio do pacote | descartado |
| `security-reviewer` | OMC | `agents/security-reviewer.md` | coberto |
| `test-engineer` | OMC | `agents/test-engineer.md`, `skills/testar/SKILL.md` | coberto |
| `tracer` | OMC | `agents/tracer.md` | coberto |
| `verifier` | OMC | `agents/verifier.md` | coberto |
| `writer` | OMC | `agents/redator-ptbr.md` | coberto |
| `brainstorming` | SP | `skills/entender/SKILL.md` | coberto |
| `diagnosing-superpowers` | SP | diagnóstico do próprio superpowers, deixa de existir com ele | descartado |
| `dispatching-parallel-agents` | SP | `rules/orquestrador.md` | coberto |
| `executing-plans` | SP | sai de propósito, o fluxo de execução é commands/implementar.md | descartado |
| `finishing-a-development-branch` | SP | `skills/git/SKILL.md` | coberto |
| `receiving-code-review` | SP | `skills/review/SKILL.md`, `scripts/reviews.mjs` | coberto |
| `requesting-code-review` | SP | `skills/review/SKILL.md`, `scripts/reviews.mjs` | coberto |
| `subagent-driven-development` | SP | `rules/orquestrador.md`, `commands/implementar.md` | coberto |
| `systematic-debugging` | SP | `skills/debugar/SKILL.md` | coberto |
| `test-driven-development` | SP | `skills/testar/SKILL.md` | coberto |
| `using-git-worktrees` | SP | `skills/git/SKILL.md` | coberto |
| `using-superpowers` | SP | sai de propósito, o roteamento é rules/orquestrador.md | descartado |
| `verification-before-completion` | SP | `skills/verificar/SKILL.md` | coberto |
| `writing-plans` | SP | `skills/planejar/SKILL.md` | coberto |
| `writing-skills` | SP | `skills/manutencao-pacote/SKILL.md` | coberto |

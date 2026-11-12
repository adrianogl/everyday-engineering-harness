# Paridade com OMC e superpowers

Esta tabela diz o que do oh-my-claudecode (OMC) e do superpowers (SP) o EEH cobre. Linha `coberto` aponta para o arquivo do repo que faz o papel e `descartado` traz o motivo.
O escopo é cada skill e agent de OMC e SP listado em `docs/triagem.tsv`. O ECC fica de fora porque não será desinstalado. O mapa vem de `fontes.json` e, onde ele não cobre, da tabela de fusões do design.

| item atual | origem | equivalente no EEH | status |
| --- | --- | --- | --- |
| `agent-doc-discipline` | OMC | regra de escrita de documento para agente; o pacote usa rules/text-pt-br.md e a skill manutencao-pacote | descartado |
| `ai-slop-cleaner` | OMC | `skills/limpar/SKILL.md` | coberto |
| `architecture-survey` | OMC | varredura periódica de arquitetura, fora do fluxo de entrega; o agent architect atende sob demanda | descartado |
| `arena` | OMC | várias tentativas paralelas julgadas por outro modelo, fora do escopo, que não é multi-model | descartado |
| `ask` | OMC | consulta a outros modelos fica fora do pacote, que não é multi-model | descartado |
| `ask-navigator` | OMC | parte do fluxo shipyard do OMC, que abre tickets de decisão no tracker | descartado |
| `autopilot` | OMC | modo autônomo, sai de propósito: o orquestrador para nas três paradas | descartado |
| `autoresearch` | OMC | loop autônomo de pesquisa, fora do fluxo de entrega | descartado |
| `babysit` | OMC | corrige e responde a PR sozinho, sem as paradas do orquestrador | descartado |
| `benchmark-checklist` | OMC | checagem de número de benchmark, fora do trabalho do dia a dia | descartado |
| `blast-radius` | OMC | triado como ideia: mapear o que quebra além do diff antes de refactor | descartado |
| `bro` | OMC | reescreve a última resposta em linguagem simples; rules/text-pt-br.md já pede texto direto | descartado |
| `cancel` | OMC | só existe para encerrar os modos autônomos, que não entram | descartado |
| `ccg` | OMC | orquestração multi-model, fora do escopo | descartado |
| `configure-notifications` | OMC | infra do OMC, o pacote não notifica | descartado |
| `correct` | OMC | transforma erro repetido em lint ou guarda; fica para a manutenção do pacote quando o caso aparecer | descartado |
| `create-formal-verification-skill` | OMC | verificação formal com TLA+, Lean ou Kani, fora da stack | descartado |
| `create-verification-skill` | OMC | triado como talvez: comandos de verificação por repo, hoje vêm do perfil e de verificar | descartado |
| `debug` | OMC | `skills/debugar/SKILL.md` | coberto |
| `deep-dive` | OMC | pipeline trace mais interview em modo autônomo; o equivalente manual é debugar seguido de entender | descartado |
| `deep-interview` | OMC | `skills/entender/SKILL.md` | coberto |
| `deepinit` | OMC | `skills/deepinit/SKILL.md` | coberto |
| `diagram` | OMC | escolha de diagrama para explicação, fora do fluxo de entrega | descartado |
| `drydock` | OMC | monta o ambiente shipyard do OMC num repo | descartado |
| `execute` | OMC | `commands/implementar.md` | coberto |
| `external-context` | OMC | `agents/document-specialist.md` | coberto |
| `figure-it-out` | OMC | gera playbook sob medida no formato do OMC; o equivalente é manutencao-pacote | descartado |
| `fix-ci` | OMC | triado como ideia: ler o log do CI vermelho e separar falha real de flaky | descartado |
| `fix-merge-conflicts` | OMC | triado como talvez: passo a passo de conflito além do rebase seguro de git | descartado |
| `get-pr-comments` | OMC | triado como talvez: a skill review já trata o feedback recebido | descartado |
| `graph` | OMC | runtime de DAG do OMC | descartado |
| `harbor` | OMC | triagem de issues e PRs de mantenedor de projeto aberto, fora do uso | descartado |
| `hillclimb` | OMC | loop autônomo de melhoria de métrica, fora do fluxo de entrega | descartado |
| `how` | OMC | `skills/explorar/SKILL.md` | coberto |
| `hud` | OMC | infra do OMC, status line fica com a configuração do Claude Code | descartado |
| `in-your-own-words` | OMC | `skills/entender/SKILL.md` | coberto |
| `intent` | OMC | intake do shipyard para quem não é engenheiro | descartado |
| `interrogate` | OMC | review adversarial com três modelos, fora do escopo, que não é multi-model | descartado |
| `ketchup` | OMC | resumo do que aconteceu na sessão; o panorama fica com entregas | descartado |
| `ketchup-video` | OMC | resumo em vídeo, fora do escopo | descartado |
| `launch` | OMC | pipeline de entrega do shipyard com team, substituído pelas fases do orquestrador | descartado |
| `learner` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `local-build-reminder` | OMC | lembrete específico do repo do OMC | descartado |
| `loft` | OMC | protótipo descartável para decidir design, fora do fluxo de entrega | descartado |
| `maintain-formal-verification-skill` | OMC | verificação formal, fora da stack | descartado |
| `maintain-verification-skill` | OMC | triado como talvez junto de create-verification-skill | descartado |
| `map` | OMC | mapa de skills do OMC; o roteamento é rules/orquestrador.md | descartado |
| `mcp-setup` | OMC | infra do OMC, configuração de MCP é nativa do Claude Code | descartado |
| `merge-readiness` | OMC | `skills/review/SKILL.md`, `scripts/reviews.mjs` | coberto |
| `minimal-code-discipline` | OMC | triado como talvez: regra de YAGNI para os implementadores | descartado |
| `minimal-prose-discipline` | OMC | `rules/text-pt-br.md` | coberto |
| `models` | OMC | roteamento de modelos do team do OMC | descartado |
| `omc-doctor` | OMC | infra do OMC, o pacote usa claude plugin validate | descartado |
| `omc-reference` | OMC | catálogo do OMC, o equivalente é rules/orquestrador.md | descartado |
| `omc-setup` | OMC | infra do OMC, o pacote usa perfil.json e SessionStart | descartado |
| `omc-teams` | OMC | modo team do OMC, sai de propósito | descartado |
| `personal-mode` | OMC | perfil de comportamento do OMC; preferência fica na memória nativa | descartado |
| `plan` | OMC | `skills/planejar/SKILL.md` | coberto |
| `pr` | OMC | `agents/redator-ptbr.md` | coberto |
| `principles` | OMC | lista de princípios do OMC, já espalhada nas regras e skills do pacote | descartado |
| `project-session-manager` | OMC | gestão de sessão do OMC, o git worktree por card cobre o isolamento | descartado |
| `ralph` | OMC | modo autônomo, sai de propósito | descartado |
| `ralplan` | OMC | `skills/planejar/SKILL.md` | coberto |
| `recall` | OMC | `skills/entregas/SKILL.md` | coberto |
| `refit` | OMC | retrospectiva baseada na instrumentação do OMC | descartado |
| `reflect` | OMC | auditoria de sessão com três revisores, fora do fluxo de entrega | descartado |
| `release` | OMC | release do próprio OMC, sem uso fora dele | descartado |
| `remember` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `research` | OMC | `agents/document-specialist.md` | coberto |
| `review` | OMC | `skills/review/SKILL.md` | coberto |
| `sciomc` | OMC | modo autônomo de pesquisa, sai de propósito | descartado |
| `sdd` | OMC | `commands/implementar.md` | coberto |
| `self-improve` | OMC | modo autônomo, sai de propósito | descartado |
| `session-flow` | OMC | `skills/entregas/SKILL.md` | coberto |
| `setup` | OMC | infra do OMC, sem equivalente necessário | descartado |
| `sharpen` | OMC | `skills/entender/SKILL.md` | coberto |
| `show-me-your-work` | OMC | `scripts/registros.mjs` | coberto |
| `skill` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `skillify` | OMC | `skills/manutencao-pacote/SKILL.md` | coberto |
| `stacked-delivery` | OMC | triado como talvez: fluxo de PR empilhada | descartado |
| `statechart` | OMC | modelo TLA+ de estados, fora da stack | descartado |
| `tdd` | OMC | `skills/testar/SKILL.md` | coberto |
| `teach` | OMC | `skills/explorar/SKILL.md` | coberto |
| `team` | OMC | modo team do OMC, sai de propósito | descartado |
| `technical-writing` | OMC | `rules/text-pt-br.md` | coberto |
| `trace` | OMC | `skills/debugar/SKILL.md` | coberto |
| `typescript-best-practices` | OMC | triado como ideia: alimentar reviewer-typescript e implementador-react | descartado |
| `ultragoal` | OMC | modo autônomo, sai de propósito | descartado |
| `ultraqa` | OMC | modo autônomo, sai de propósito | descartado |
| `ultrawork` | OMC | modo autônomo, sai de propósito | descartado |
| `verify` | OMC | `skills/verificar/SKILL.md` | coberto |
| `visual-verdict` | OMC | `agents/front-visual.md` | coberto |
| `what-did-i-get-done` | OMC | triado como ideia: resumo de commits do período para a daily | descartado |
| `why` | OMC | triado como ideia: investigar pelo histórico do git por que o código está assim | descartado |
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

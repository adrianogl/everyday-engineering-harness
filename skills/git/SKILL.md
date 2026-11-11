---
name: git
description: Opera git com segurança: worktree isolado por card, commits atômicos divididos por assunto, mensagem de commit em Conventional Commits que segue o histórico do repo, rebase seguro e fechamento da branch (merge local, PR ou manter). Use ao preparar commit, dividir mudanças, escrever ou conferir mensagem, abrir worktree ou integrar uma branch. Não use para decidir o que o código deve fazer nem para review de PR (ver review).
metadata:
  origin: omc+superpowers+ecc
---

# Git

As regras de branch, de commit e de confirmação estão em `rules/git.md` e valem aqui sem exceção: nada de commit direto em main ou master, branch nova a partir da principal, e commit, push, merge e rebase só depois de aprovação explícita do autor. Esta skill é o como. Quando o autor pede para commitar, mostre `git status`, `git diff --staged` e a mensagem proposta, e espere a aprovação antes de rodar `git commit`.

## Worktree por card

Implementação roda num worktree por card, para as entregas não pisarem uma na outra.

1. Detecte se já está num worktree vinculado:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
git rev-parse --show-superproject-working-tree
```

   Os dois primeiros diferentes, e o terceiro vazio, significam worktree vinculado: não crie outro. Se o terceiro devolve um caminho, é submódulo, que conta como repo normal.
2. Sem worktree, use a ferramenta nativa da sessão (`EnterWorktree`, `--worktree`) antes de `git worktree add`. Ferramenta nativa cuida de local, branch e limpeza; contorná-la cria estado que a sessão não enxerga.
3. Sem ferramenta nativa, `git worktree add .worktrees/<branch> -b <branch>`. Antes, confirme que a pasta está no `.gitignore` (`git check-ignore -q .worktrees`); se não estiver, proponha a entrada no `.gitignore` e só commite depois da aprovação explícita do usuário, como em qualquer outro commit; sem a entrada, o conteúdo do worktree entra no repo.
4. Se o sandbox bloquear a criação, diga isso e trabalhe no diretório atual.
5. Prepare o ambiente (`npm install`, `go mod download`) e rode os testes para ter uma linha de base limpa. Se já falham, reporte e pergunte se segue.

## Commits atômicos

Um commit com 15 arquivos não dá para bisectar, revisar nem reverter. Cada commit faz uma coisa e pode ser revertido sem quebrar o build.

1. Veja o estilo do repo: `git log --no-merges --format=%s -30`. Meça o idioma, o formato e o tamanho típico do assunto. O padrão do autor (Conventional Commits em PT-BR) vale, a menos que o repo siga outro.
2. Mapeie a mudança: `git status` e `git diff --stat`. Agrupe por assunto.
3. Divida quando houver: módulos ou diretórios diferentes, tipos de mudança diferentes (config, lógica, teste, doc), ou partes que se revertem independentemente. Referência: 3 ou mais arquivos em 2 commits ou mais, 5 ou mais em 3, 10 ou mais em 5, quando os assuntos são distintos.
4. Crie os commits na ordem de dependência (`git add -p` para separar hunks). Mostre o `git log --oneline` no fim.
5. Teste e implementação do mesmo comportamento vão juntos no mesmo commit.

## Mensagem de commit

Formato e exemplos em `rules/git.md`; texto em PT-BR segue `rules/text-pt-br.md`. Ao propor ou conferir uma mensagem:

1. Leia `git diff --staged` (ou `git diff`, se nada está staged). Sem diff, diga isso e pare; não invente conteúdo.
2. Classifique o tipo: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. Escopo vem do diretório ou da convenção que o histórico mostra.
3. O assunto descreve o efeito, não o mecanismo: "corrige total do carrinho vazio", não "adiciona checagem de nulo". Imperativo, minúsculas, sem ponto final.
4. Corpo só quando o motivo não é óbvio pelo diff, e fala do porquê.
5. Mudança de contrato público ou que exige migração leva `!` depois do tipo e escopo, e um rodapé `BREAKING CHANGE:` com a migração. Confira contra o contrato de fato.
6. Se o diff mistura assuntos sem relação, diga e proponha a divisão com uma mensagem para cada, em vez de forçar uma só.
7. Atribuição: nada de `Co-Authored-By`, rodapé de "gerado por" ou menção a IA.

Quem propõe a mensagem não comita sozinho: apresenta e espera a aprovação.

## Rebase e histórico

- Nunca faça rebase de main ou master.
- Faça stash do que está sujo antes do rebase.
- Push depois de rebase usa `--force-with-lease`, nunca `--force`, e só com o autor aprovando.
- Push rejeitado significa que o remoto andou: investigue. Force push só se o autor pedir com todas as letras.
- Para achar quando algo entrou: `git log -S<texto>`, `git blame`, `git bisect`.

## Fechar a branch

Com a implementação pronta:

1. Rode a suíte completa na árvore que vai ser integrada. Se falha, relate e pare: o menu vem depois do verde. Para a prova de que está pronto, siga `verificar`.
2. Descubra a base: o que o plano, a conversa ou o upstream da branch dizem. Na dúvida, pergunte "essa branch saiu de <palpite>, está certo?". Integrar na base errada é caro de desfazer.
3. Ofereça as opções e espere a escolha do autor:
   1. fazer merge local na base;
   2. dar push e abrir PR;
   3. manter a branch como está.
   Em HEAD destacado (workspace gerenciado de fora), só push como branch nova com PR, ou manter.
4. Executar a escolha:
   - Merge local: `git checkout <base> && git pull && git merge <branch>`, testes no resultado do merge e, se verdes, remover o worktree e `git branch -d <branch>`. Se os testes falham no merge, pare e deixe branch e worktree no lugar.
   - PR: `git push -u origin <branch>`, e abrir a PR contra a base seguindo o template do repo (`.github/pull_request_template.md`) e `rules/text-pt-br.md`. Mantenha o worktree, porque o feedback da PR é corrigido nele.
   - Manter: avise onde a branch e o worktree ficaram.
5. Descartar trabalho só quando o autor pedir com todas as letras, depois de mostrar o que será apagado (branch, commits, worktree) e receber a confirmação digitada `descartar`. Só então `git branch -D`.
6. Limpe só worktree sob `.worktrees/` ou `worktrees/`. Se `git worktree remove` recusar por arquivos não commitados, nunca use `--force` por conta própria: mostre `git status --porcelain -uall`, e pergunte se commita, move ou apaga.

## Sinais de alerta

- "O teste passou mais cedo" (rode na árvore que vai ser integrada).
- "Ele obviamente quer o merge" (a integração é decisão do autor).
- "A PR está aberta, o worktree virou lixo" (ele fica até o trabalho entrar).
- "Esse outro worktree parece velho, limpo também" (só o que foi criado por você).

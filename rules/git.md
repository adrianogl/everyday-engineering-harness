## Workflow de Git

### Branches

- Nunca fazer commit direto em main ou master.
- Criar uma branch nova a partir da principal antes de qualquer alteração.
- Nomear a branch seguindo Conventional Commits:
  - `feat/descricao-curta`: nova funcionalidade
  - `fix/descricao-curta`: correção de bug
  - `chore/descricao-curta`: manutenção
  - `refactor/descricao-curta`: refatoração sem mudança de comportamento
  - `docs/descricao-curta`: documentação
  - `test/descricao-curta`: testes
  - `perf/descricao-curta`: desempenho

### Antes de qualquer commit

1. Conferir a branch atual com `git branch --show-current`.
2. Se estiver em main ou master, atualizar a principal (`git checkout main && git pull`) e criar a branch (`git checkout -b <tipo>/<descricao>`).
3. Mostrar as alterações (`git status` e `git diff --staged`) e a mensagem de commit proposta.
4. Esperar confirmação explícita antes de rodar `git commit`.

### Confirmação obrigatória

- Nunca fazer commit automaticamente, mesmo depois de concluir a tarefa.
- Apresentar a mensagem de commit proposta e esperar aprovação explícita.
- O mesmo vale para `git push`, `git merge`, `git rebase` e qualquer operação que altere o histórico ou o remoto.
- Na dúvida sobre escopo ou mensagem, perguntar antes de agir.

### Mensagens de commit

- Conventional Commits: `<tipo>(<escopo opcional>): <descrição>`.
- Exemplos:
  - `feat(auth): adiciona login com OAuth`
  - `fix(api): corrige timeout em requisições longas`
  - `refactor: extrai lógica de validação para service`
- Descrição em minúsculas, no imperativo, sem ponto final.

### Atribuição

- Sem trailer `Co-Authored-By` de assistente.
- Sem rodapé de "gerado por" ou similar.
- Sem menção a IA ou ao assistente na mensagem de commit.

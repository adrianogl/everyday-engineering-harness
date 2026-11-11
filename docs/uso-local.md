# Uso local

## Rodar sem instalar

```bash
claude --plugin-dir ~/Code/everyday-engineering-harness
```

O plugin vale só para essa sessão. Edite os arquivos e rode `/reload-plugins` para recarregar.

## Sessão isolada

Para testar sem os plugins e as skills da sua config diária, aponte `CLAUDE_CONFIG_DIR` para uma pasta vazia:

```bash
CLAUDE_CONFIG_DIR=~/.claude-eeh-teste claude --plugin-dir ~/Code/everyday-engineering-harness
```

A pasta começa sem login. Na primeira vez, rode `/login` dentro da sessão. Modo headless sem login falha com "Not logged in".

## Conferir antes de desinstalar OMC e superpowers

Na sessão isolada, com o perfil real e o login feito:

1. `/eeh:adr` com o template real de ADR. Confira se as seções saem na ordem do template.
2. `/eeh:quebrar` numa ADR já aprovada, parando antes de criar os cards. Confira os cards propostos e a divisão por repo.
3. `/eeh:review` duas vezes na mesma PR. Na segunda rodada, o review deve ler o histórico da primeira e só trazer o que é novo.
4. `/eeh:upstream` numa rodada real, parando na `Parada 1: incorporar`.

Se os quatro passarem, a troca pode seguir a tabela de `docs/paridade.md`.

## Instalar pelo marketplace do repo

Dentro de uma sessão do Claude Code:

```
/plugin marketplace add ~/Code/everyday-engineering-harness
/plugin install eeh@everyday-engineering-harness
```

Depois de alterar o plugin, rode `/plugin marketplace update everyday-engineering-harness`.

## Perfil

O perfil fica fora do repo, em `~/.config/eeh/perfil.json`. Para usar outro caminho, defina `EEH_PERFIL`. Comece copiando `perfil.example.json`:

```bash
mkdir -p ~/.config/eeh
cp perfil.example.json ~/.config/eeh/perfil.json
```

Sem o arquivo, o hook de `SessionStart` avisa que o perfil está ausente e o plugin segue sem ele.

| Campo | Para que serve |
| --- | --- |
| `versao` | versão do formato do perfil, hoje `1` |
| `atlassian.mcp` | nome do servidor MCP do Atlassian |
| `atlassian.site` | domínio do site Atlassian (obrigatório) |
| `atlassian.cloudId` | cloudId do site (obrigatório) |
| `atlassian.projeto` | chave do projeto Jira (obrigatório) |
| `atlassian.accountId` | seu accountId no site (obrigatório) |
| `atlassian.transicaoConcluido` | id da transição para Concluído; vazio se não souber |
| `confluence.espaco` | chave do espaço do Confluence |
| `confluence.templateAdr` | id da página que serve de template de ADR |
| `figma.mcp` | nome do servidor MCP do Figma |
| `repos` | lista de `nome`, `caminho` e `stack` (`go` ou `react`) |
| `extensoes` | skills próprias, cada uma com `skill` e `quando` (`atalho` ou `fim:<fase>`) |
| `registros` | pasta onde ficam os registros de decisão das entregas |
| `denylist` | termos internos que o sanitizer barra em arquivos do repo |

## Conferir antes de commitar

```bash
npm test
node scripts/sanitize.mjs --staged
```

O sanitizer compara cada termo da `denylist` como palavra inteira, sem diferenciar maiúscula de minúscula. Termo curto não casa dentro de palavra maior, mas casa dentro de composto com hífen.

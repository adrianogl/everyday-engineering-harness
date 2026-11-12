---
name: deepinit
description: Gera um AGENTS.md por pasta relevante de um repo de trabalho, só com o que o código mostra, cada afirmação com repo:caminho:linha ou marcada como não verificado, em PT-BR quando o autor pedir. Use ao entrar num repo sem documentação para agentes ou quando os AGENTS.md ficaram defasados. Não use para escrever CLAUDE.md do repo inteiro de memória, para documentar regra de negócio que o código não mostra nem para repo que já tem AGENTS.md mantido à mão (nesse caso, só atualize o que mudou).
metadata:
  origin: omc
---

# Deepinit

Gera `AGENTS.md` por pasta para que o próximo agente entenda o que há ali sem reler tudo. Vale o que o código mostra. Texto em PT-BR quando o autor pedir, seguindo `rules/text-pt-br.md`; nomes de código ficam como estão.

## Regra de evidência

Cada afirmação de um `AGENTS.md` cita a origem no formato `repo:caminho:linha` (por exemplo `frete-api:internal/cotacao/service.go:42`). Se não deu para confirmar no código, escreva `não verificado` no lugar da citação. Não preencha com o que "costuma ser" nem deduza intenção que o código não mostra.

Proibido: descrição genérica ("camada responsável por ..."), arquivo descrito sem ter sido aberto, comando de teste que não está no `Makefile`, `package.json` ou CI, e convenção inferida de um arquivo só.

## Fluxo

1. Confirme o repo e a branch (`git branch --show-current`). Peça ao autor o idioma se ele não disse.
2. Mapeie as pastas. Ignore `node_modules`, `.git`, `dist`, `build`, `vendor`, `coverage`, cache e pasta gerada. Pode usar o agent `explorar` para o mapa.
3. Escolha quais pastas ganham arquivo:
   - tem código ou configuração própria: sim;
   - só contém subpastas: arquivo mínimo, só com a lista delas;
   - vazia, ou só com arquivo gerado: pula.
4. Gere do nível mais raso para o mais fundo, para a referência ao pai existir. Para cada pasta, abra os arquivos antes de descrever.
5. Se já existe `AGENTS.md`, leia primeiro. Mantenha a seção `## Notas manuais` e tudo abaixo dela, atualize só o que o código contradiz ou deixou de cobrir e liste a diferença.
6. Valide: toda referência ao pai resolve, nenhum `AGENTS.md` ficou órfão, nenhuma pasta escolhida ficou sem arquivo e cada citação `repo:caminho:linha` aponta para uma linha que existe.
7. Mostre ao autor o conteúdo de cada arquivo (ou o diff, nos existentes), a lista de pastas puladas com o motivo e as marcas `não verificado`.

Parada 1: gravar os AGENTS.md. Sem aprovação explícita do autor, nenhum arquivo é gravado.

8. Com a aprovação, grave os arquivos e rode a validação do passo 6 de novo. Não faça commit sem o autor pedir.

## Modelo de arquivo

```markdown
**Pasta pai:** `../AGENTS.md`

# <pasta>

## Propósito
<uma ou duas frases, com repo:caminho:linha>

## Arquivos principais
| Arquivo | O que faz |
| --- | --- |
| `cotacao.go` | calcula o frete por faixa de CEP (`frete-api:internal/cotacao/cotacao.go:18`) |

## Subpastas
| Pasta | Propósito |
| --- | --- |
| `tarifa/` | tabela de tarifas, ver `tarifa/AGENTS.md` |

## Para quem altera aqui
- como rodar os testes desta pasta (`frete-api:Makefile:12`, ou não verificado)
- padrão que o código repete e vale seguir (com a citação)
- dependências internas e externas que importam

## Notas manuais
Escritas à mão e preservadas quando o arquivo é gerado de novo.
```

O arquivo da raiz não leva a linha `Pasta pai`. Seções sem conteúdo verificável saem em vez de ficarem com texto genérico.

Nada que o agente precisa ler vai em comentário HTML (`<!-- ... -->`): o Claude Code remove esses comentários antes de o arquivo chegar ao modelo.

## Como o AGENTS.md é carregado

O Claude Code carrega `CLAUDE.md` aninhado pelo nome do arquivo, mas não carrega `AGENTS.md` aninhado, e um `@AGENTS.md` na raiz não alcança as subpastas. Para o `AGENTS.md` da raiz valer, o repo precisa de um `CLAUDE.md` com `@AGENTS.md` ou de um symlink `CLAUDE.md` → `AGENTS.md`; confira e, se faltar, proponha ao autor junto da parada 1. Os arquivos das subpastas só são lidos quando um agente os abre: o `AGENTS.md` da raiz lista as subpastas que têm o seu.

## Limites

- Não invente comandos, variáveis de ambiente nem nomes de serviço.
- Não copie o `README` para o `AGENTS.md`: aponte para ele.
- Nada específico do empregador do autor em peça deste pacote. O `AGENTS.md` gerado vive no repo de trabalho, e lá o conteúdo é do repo.

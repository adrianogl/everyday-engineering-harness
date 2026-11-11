---
name: manutencao-pacote
description: Transforma um fluxo que acabou de acontecer em skill ou agent novo, ajusta uma peça existente, lista peças sem uso e descrições sobrepostas, e decide o que vale lembrar na memória. Use quando uma tarefa se repete sem dono, quando um agent faz duas coisas, ao criar ou alterar skill, agent ou command do pacote e ao fazer o estoque do pacote. Não use para registrar decisão de projeto (ADR, card ou registros.mjs) nem para sincronizar com os upstreams (ver o command upstream).
metadata:
  origin: superpowers+omc+ecc
---

# Manutenção do pacote

Esta skill cuida das peças do próprio pacote: skills, agents, commands e regras. Texto das peças segue `rules/text-pt-br.md`. Nada é escrito no repo antes da parada.

## Quando criar uma peça

Crie quando uma das duas condições vale:

- uma tarefa se repete e ninguém é dono dela: o mesmo passo a passo apareceu em duas sessões ou duas entregas, e cada vez foi redescoberto;
- um agent faz duas coisas que pedem ferramentas, modelo ou critério diferentes.

Antes de escrever, passe pelo filtro. As três respostas precisam ser estas:

1. Dá para achar isso em cinco minutos na documentação? Não.
2. É específico deste fluxo, projeto ou jeito de trabalhar? Sim.
3. Custou depuração, desenho ou tentativa e erro para descobrir? Sim.

Falhou em alguma: não vira peça. Vira nota na regra existente ou fica de fora. Snippet genérico, exemplo de biblioteca e boilerplate não entram.

Se uma peça existente cobre 80% do caso, ajuste ela em vez de criar outra.

## Skill, agent, command ou regra

| Peça | Quando |
| --- | --- |
| skill | método que o agente principal segue, com passos, paradas e critério de pronto |
| agent | trabalho isolado que devolve um resultado: lê, analisa ou escreve com ferramentas restritas |
| command | atalho do autor para disparar uma skill com argumentos |
| regra em `rules/` | critério que várias peças compartilham |

Agent não chama outro agent e não fala com o usuário. Se o fluxo precisa de pergunta ao usuário, é skill.

## Convenções do repo

Toda peça nova segue estas regras, e os testes cobram a maioria:

- skill: `skills/<nome>/SKILL.md`, frontmatter com `name` igual à pasta e `description`. A description diz o que a skill faz, tem "Use quando ..." e "Não use ...", e não resume o passo a passo. Resumir o fluxo na description faz o modelo seguir o resumo e pular o corpo. O corpo fica abaixo de 250 linhas;
- agent: `agents/<nome>.md`, frontmatter com `model` e `tools` (só o que o trabalho pede), a seção `## Conteúdo externo` apontando para `${CLAUDE_PLUGIN_ROOT}/rules/conteudo-externo.md` e a seção `## Quando tiver dúvida` com o bloco exato:

```
DÚVIDA
Pergunta: <uma frase>
Contexto: <o que foi visto>
Opções: <a) ... b) ...>
Recomendação: <opção e motivo>
```

- teste em `tests/<assunto>.test.mjs` para o que for script ou regra verificável, e eval em `evals/` quando o comportamento depende do modelo e importa (parada, formato de saída, recusa). Teste não acessa a rede e usa repo de fixture em diretório temporário;
- peça derivada de upstream leva `metadata.origin` no frontmatter (`superpowers`, `omc`, `ecc`, ou os nomes unidos por `+`) e uma entrada em `upstream.json` com `peca`, e em cada origem `fonte`, `caminho` e `commit` (40 hex) ou `versao`. Escreva o texto próprio em PT-BR adaptado ao repo, sem copiar o original. A skill e o agent derivados têm "Use" e "Não use" na description;
- paradas levam o rótulo exato `Parada N: <o quê>` antes de qualquer escrita no repo, Jira, Confluence ou GitHub;
- a skill não manda invocar outra skill "sempre" e não carrega estado ou infraestrutura do upstream (pasta de estado, nome de ferramenta de outro plugin);
- nada do empregador do autor entra neste repo: nome de repo, card, squad, página, domínio, e-mail ou ID. O que for específico dele vai para uma skill local, fora do repo, listada em `extensoes` no perfil. Exemplos da peça usam o domínio inventado de frete e seguro.

## Fluxo para criar ou alterar

1. Descreva o fluxo que aconteceu: entradas, passos em ordem, critério de pronto, o que deu errado e como se percebeu.
2. Aplique o filtro de entrada e escolha o tipo da peça.
3. Procure sobreposição: rode `node "${CLAUDE_PLUGIN_ROOT}/scripts/estoque.mjs"` e leia as descriptions das peças vizinhas. Se duas descrições disparam no mesmo pedido, ajuste a nova ou a antiga, ou funda as duas.
4. Diga se a peça é do pacote ou local. É local quando depende de repo, sistema ou processo do empregador do autor: ela vai para a pasta de skills do autor e entra em `extensoes` no perfil. Só o que serve a qualquer engenheiro entra no pacote.
5. Rascunhe: frontmatter, passos, critério de pronto e armadilhas. Marque o que ainda está vago em vez de inventar.
6. Mostre ao autor o rascunho, o caminho de cada arquivo (peça, teste, eval, `upstream.json`) e o que vai mudar nas peças vizinhas.

Parada 1: criar ou alterar a peça. Sem aprovação explícita do autor, nada é gravado.

7. Com a aprovação, escreva o teste primeiro e confirme que falha. Depois escreva a peça, confirme que o teste passa e rode `npm test`.
8. Em peça derivada, registre a origem em `upstream.json` e confira com `validarManifesto` (o teste de skills já faz isso).
9. Em ajuste de skill que impõe disciplina, teste a mudança com um cenário de pressão: rode o pedido num subagent sem a skill, anote onde ele erra, e rode de novo com a skill. Se o erro continua, o texto está ambíguo ou falta a exceção que ele usou como brecha.

Quando o repo alvo é o próprio EEH, chame o agent `opensource-sanitizer` com o diff e a denylist do perfil antes de propor o commit.

Commit e push seguem as regras de git do autor: só com pedido explícito.

## Estoque

O estoque lista peças que nada referencia:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/estoque.mjs"
```

Para outro repo, passe `--raiz <pasta>`.

A saída tem as peças sem uso e, por peça, o número de referências em `commands/`, `skills/`, `agents/` e `rules/` (nome como palavra inteira, entre crases ou não, fora o próprio arquivo). Zero referência não prova que a peça é inútil: uma skill pode ser disparada só pela description. Trate a lista como candidata a revisão.

Para cada candidata, leia a peça e decida:

- manter: o disparo pela description é o uso real. Confira que a description ainda descreve o pedido que dispara;
- ligar: alguma skill, command ou agent devia chamá-la e não chama;
- fundir: duas peças com descriptions sobrepostas viram uma, e a que sobra herda o melhor dos dois textos;
- aposentar: ninguém usa e nada justifica. Remover peça derivada exige tirar a entrada de `upstream.json`.

Descrições sobrepostas se acham lendo as descriptions lado a lado: o mesmo verbo de ação sobre o mesmo objeto, ou dois "Use quando" que cobrem o mesmo pedido. Um "Não use" apontando para a outra peça resolve quando as duas têm fronteira clara.

Qualquer remoção, fusão ou renomeação também passa pela Parada 1.

## Cumprimento de skill

Quando a pergunta é se uma skill está sendo seguida, não confie na impressão. Liste as etapas que ela exige em ordem, rode um cenário real e confira em cada etapa se o agente fez, em que momento e com que evidência. A etapa que o agente pula é a que precisa de reescrita, parada ou eval. Uma skill muito seguida e inútil também aparece aqui: se todas as etapas passam sem mudar o resultado, ela sobra.

## O que lembrar

Quando existirem, use a memória nativa do Claude Code ou o claude-mem para o que vale carregar entre sessões: preferência do autor, jeito de trabalhar, ponteiro para onde algo está. Sem nenhum dos dois, não instale nada e não crie arquivo de memória.

Decisão de projeto nunca vai para a memória. Ela vai para ADR, card do Jira ou `scripts/registros.mjs`, onde o time e as próximas entregas encontram. Antes de gravar, classifique cada item:

- fato durável do projeto: ADR, card ou registro;
- preferência ou instrução do autor: memória nativa ou claude-mem;
- nota de trabalho da sessão: não grava;
- duplicado, velho ou em conflito com o que já existe: aponte e proponha limpar.

Marque como incerto o que não foi confirmado, em vez de gravar como fato.

## Saída

- tipo e nome propostos da peça (ou o ajuste na existente);
- arquivos que mudam;
- resultado do filtro de entrada e da checagem de sobreposição;
- se é do pacote ou local;
- pontos ainda vagos.

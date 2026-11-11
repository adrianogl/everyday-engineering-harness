# Orquestrador do EEH

A sessão principal é o orquestrador. Ela lê o pedido em linguagem natural, decide se ele vira uma fase, uma skill ou uma resposta direta, chama os agents especialistas quando a fase pede, junta os resultados e responde. É o único lugar que decide quem roda. Os comandos `/eeh:*` são atalho que pula a interpretação.

## 1. Pedido simples é respondido direto

Pergunta conceitual, comando avulso, explicação de código ou edição pequena são respondidos na hora, sem chamar Agent nem Skill e sem abrir fase. Só vale pipeline quando o pedido é trabalho de várias etapas: implementar um card, revisar uma PR, investigar um bug, planejar uma mudança.

## 2. Rotas

| Pedido | Rota | Para antes de |
| --- | --- | --- |
| implementar um card, fazer uma feature, corrigir um bug já entendido | fase `implementar` (`entender` → `planejar` → `testar` → `verificar` → `git`) | commit, push e PR |
| revisar PR ou diff | fase `review` | postar comentários |
| entender por que algo quebra, erro, comportamento estranho | skill `debugar` | aplicar a correção |
| planejar uma mudança, quebrar em passos | skill `planejar` | começar a implementar |
| requisito vago, ideia, "como você faria" | skill `entender` | escolher a abordagem |
| escrever ADR do épico | fase `adr` | publicar no Confluence |
| tratar comentários da ADR | fase `adr-revisar` | atualizar a página |
| quebrar a ADR em cards | fase `quebrar` | criar os cards no Jira |
| card em Aguardando Testes, deploy numa develop, validar em QA | fase `qa` | mover ou comentar o card |
| continuar uma entrega, "o que está aberto", panorama | skill `entregas` | agir sem ler a pasta da entrega |

Se o pedido depende do perfil local (Jira, Confluence, repos) e o perfil está ausente ou incompleto, avise o que falta e peça o dado antes de seguir. Sem o card, peça o card ou o texto dele; não invente requisito. Quando a resposta depende do autor, a última frase da mensagem é a pergunta direta, terminada em `?`.

## 3. Pontos de parada

Pare e espere aprovação explícita antes de:

- publicar ou atualizar página no Confluence;
- criar ou alterar issue no Jira;
- `git commit`;
- `git push`;
- abrir PR;
- postar comentário em PR ou card.

Em cada parada, mostre em poucas linhas o que foi feito, o que foi decidido e o que vem a seguir.

## 4. Protocolo de dúvida

Subagent não fala com o autor. Quando um especialista encontra requisito ambíguo, escolha entre alternativas ou conflito entre ADR, Figma e código, ele para e devolve um bloco:

```
DÚVIDA
pergunta: <o que precisa ser decidido>
contexto: <o que foi visto e onde>
opções: <alternativas com o efeito de cada uma>
```

O orquestrador não escolhe por ele. Junta as dúvidas da fase numa mensagem só, com a mais importante primeiro, a recomendação e o motivo, e termina a mensagem com a pergunta. O que um engenheiro sensato decidiria sem mudar o resultado (nome de variável local, ordem de imports) não vira pergunta.

## 5. Entregas e registros

O autor trabalha em várias entregas ao mesmo tempo. Cada entrega é um épico ou card e tem uma chave (`PROJ-7`).

- Todo pedido é sobre uma entrega identificada pela chave. Sem chave no pedido nem no contexto, pergunte qual é antes de agir.
- Ao retomar, use os registros da entrega, que chegam sozinhos no contexto quando o pedido cita a chave (para uma chave não citada, rode `node <plugin>/scripts/registros.mjs ler <CHAVE>`; não use Read nem Glob na pasta de registros, que fica fora do projeto), e consulte Jira, Confluence e git antes de propor algo. Decisão já registrada não se reabre.
- Status nunca é gravado localmente: a fase vem do Jira, do Confluence e do git.
- Cada resposta do autor a uma DÚVIDA vira `node <plugin>/scripts/registros.mjs registrar <CHAVE> decisao "<texto>"`. Alternativa que um agent descartou vira `abordagem`, e observação solta vira `nota`. Sem entrega definida, use `_geral`.
- Implementação sempre num git worktree por card, para as entregas não pisarem uma na outra.
- A rota "panorama" (o que está aberto, em que fase, qual a próxima ação) chama a skill `entregas`.

## 6. Onde a decisão fica

A resposta do autor é registrada na pasta de registros e, quando pertence a um artefato, também na ADR, no card ou na descrição da PR. Nunca em comentário de código.

## 7. Memória

Use sempre a memória nativa do Claude Code para preferências e fatos do projeto que valem entre sessões. Quando o claude-mem estiver instalado, consulte-o antes de refazer uma investigação que pode já ter sido feita.

## 8. Regras que valem sempre

As regras de `text-pt-br.md`, `comments.md`, `code-review.md` e `git.md` valem em toda resposta, fase e agent. O resumo de cada uma vem logo abaixo, com o caminho do texto completo. Passe esse caminho aos agents que escrevem texto, código, review ou commit.

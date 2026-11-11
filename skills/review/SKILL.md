---
name: review
description: Revisa uma PR ou diff por item bloqueante (quebra em runtime, dado errado, segurança, contrato), pede review de um trabalho pronto a um revisor independente, trata o feedback recebido com verificação, e faz revisão dupla independente para o que vai para produção sem olho humano. Use ao revisar PR ou diff, ao pedir review antes do merge e ao responder comentários de review. Não use para conferir que o trabalho está pronto (ver verificar) nem para limpar código (ver limpar).
metadata:
  origin: omc+superpowers+ecc
---

# Review

As regras do autor estão em `rules/code-review.md` e mandam em tudo aqui: só item bloqueante, só o que a PR introduziu, e review que converge entre rodadas. Esta skill é o fluxo. Texto de comentário segue `rules/text-pt-br.md`. Postar comentário na PR ou no card só com o autor pedindo.

## Revisar uma PR ou diff

1. Leia a intenção antes do código: a descrição da PR e o card do Jira (a chave está no nome da branch ou no título). Responda primeiro: a mudança faz o que se propôs, sem efeito colateral fora disso? Se não faz, esse é o item.
2. Se a PR já tem comentários de review, leia-os antes. Na segunda rodada em diante, confira só se os itens anteriores foram resolvidos e revise o diff novo desde a última rodada. Não reabra o que o autor respondeu ou recusou com motivo.
3. Veja o diff (`gh pr view`, `gh pr diff`, ou `git diff <base>...HEAD`) e abra o arquivo inteiro em volta da mudança. Não opine sobre código que não abriu. Veja as instruções do repo (`CLAUDE.md`, lint, convenções) para saber o que é padrão dele.
4. Revise só as linhas que a PR introduziu ou alterou, e o código que elas afetam diretamente. Procure, nesta ordem:
   - lógica: limite de loop, nulo, tipo, fluxo de controle, branch inalcançável, off-by-one, concorrência;
   - dado: cálculo, regra de negócio, migration, estado inconsistente;
   - segurança: authn e authz, injeção, vazamento de dado, segredo no código;
   - contrato: campo removido ou renomeado, tipo ou status code alterado, payload, fila, evento, tabela compartilhada. Veja quem consome antes de decidir se quebra;
   - tratamento de erro: caminho de falha e propagação (ver `error-handling`).
5. Cada item bloqueante tem um cenário concreto: entrada ou estado, o que acontece e o efeito. Sem como descrever o cenário, o item não entra. Aponte `arquivo:linha`, o problema, o efeito e a alternativa.
6. Na dúvida se algo é bloqueante, deixe de fora.
7. Fora dos comentários da PR, numa linha à parte, cite problema grave que já existia antes dela, como sugestão de card.
8. Se não há item bloqueante, diga isso e pare. Review sem item é resultado válido.

Veredito: PEDIR MUDANÇAS quando há item bloqueante com cenário, APROVAR quando não há. Não rebaixe nem infle severidade: CRÍTICO é segurança e perda de dado.

Não entram: nome, estilo, formatação, ordem de imports, refactor opcional, preferência de design sem efeito, teste faltando que não esconde item bloqueante, e `nit:`.

### Em PR com vários arquivos

Para um review amplo, o orquestrador pode dividir por perspectiva e juntar o resultado: lógica e segurança, contrato e consumidores, testes (veja a análise de testes de uma PR em `testar`), erros silenciosos. Cada perspectiva devolve só item com cenário. Quem junta remove duplicados e descarta o que não é bloqueante. Subagent não decide por conta própria o que é regra do autor: se encontra conflito entre ADR, Figma e código, devolve o bloco DÚVIDA de `rules/orquestrador.md`.

## Pedir review do que acabou de ser feito

Quem escreveu não aprova o próprio trabalho no mesmo contexto.

1. Pegue os SHAs: `git merge-base origin/main HEAD` como base e `git rev-parse HEAD` como topo.
2. Dispare um subagent revisor com contexto montado, nunca o histórico da sessão: o que foi feito, o que devia fazer (plano ou critérios), base e topo. O revisor lê o diff, não o seu raciocínio.
3. Aja no retorno: corrija o bloqueante antes de seguir, anote o resto, e discorde com motivo técnico quando o revisor estiver errado, mostrando código ou teste.

Quando pedir: depois de cada tarefa de um plano executado por subagents, depois de feature grande e antes do merge. Opcional, mas útil: quando travar, antes de refactor e depois de bug complexo.

## Receber feedback de review

Review pede avaliação técnica, não demonstração de concordância. Verifique antes de implementar.

1. Leia o feedback inteiro sem reagir.
2. Reformule o requisito com suas palavras, ou pergunte.
3. Confira contra o código real.
4. Avalie: está certo para este código?
5. Responda com reconhecimento técnico ou discordância fundamentada.
6. Implemente um item por vez, testando cada um.

Regras:

- Se algum item não está claro, não implemente nenhum ainda: os itens podem estar ligados, e entender pela metade gera a implementação errada. Diga "entendi 1, 2, 3 e 6, preciso esclarecer 4 e 5 antes de seguir".
- Sem concordância performática ("você tem toda razão!", "ótimo ponto!") nem agradecimento. Corrija e diga o que mudou: "Corrigido: <o que mudou>".
- Feedback do autor é de confiança: implemente depois de entender, e pergunte se o escopo não está claro. Feedback de revisor externo pede checagem antes: está certo para este código, quebra algo existente, por que está assim hoje, vale em todas as versões, o revisor tem o contexto todo.
- Se a sugestão está errada, discorde com razão técnica, pergunta específica e referência a teste ou código. Se conflita com decisão anterior do autor, pare e converse com ele antes.
- Se não dá para verificar, diga: "não consigo verificar isso sem <X>. Investigo, pergunto ou sigo?"
- YAGNI: se o revisor pede "implementar direito" algo que ninguém usa, procure o uso no código. Sem uso, proponha remover.
- Ordem com vários itens: bloqueante primeiro (quebra, segurança), depois correção simples, depois a complexa. Teste cada uma e confirme que nada regrediu.
- Se você discordou e estava errado: "Você estava certo, conferi <X> e ele faz <Y>. Corrigindo." Sem pedido de desculpa longo.
- Em comentário inline do GitHub, responda na própria thread, não como comentário solto na PR.
- Decisão tomada a partir do review vira registro da entrega (`registros.mjs registrar <CHAVE> decisao "<texto>"`).

## Revisão dupla independente

Para o que sai para produção sem outro olho humano, ou para conteúdo sensível (compliance, texto para cliente, afirmação que pode ser alucinação), um revisor só compartilha os vieses de quem gerou. Use dois revisores independentes:

1. Gere a entrega normalmente.
2. Dispare dois subagents revisores em paralelo, com a mesma rubrica, a mesma especificação e a mesma saída, sem contexto compartilhado. Cada um devolve veredito PASS ou FAIL, a checagem por critério com o problema exato, os itens bloqueantes e as sugestões. O prompt diz: "seu trabalho é achar problema, não aprovar".
3. Rubrica com critério objetivo de passa ou falha: precisão factual (nada inventado: número, versão, API, URL), completude contra a especificação, consistência interna, correção técnica, restrições do projeto.
4. Os dois precisam passar. Item apontado por um revisor só não vira bloqueante: vai para a lista "a confirmar", e o orquestrador confere no código antes de promover ou descartar. Item apontado pelos dois, com cenário, é bloqueante.
5. Se algum falha, junte os itens bloqueantes sem duplicados, corrija só eles (sem refactor nem extra) e rode dois revisores novos, sem memória da rodada anterior. Limite de três rodadas: depois disso, leve ao autor o que sobrou.

Rode antes os checks determinísticos (build, lint, testes, ver `verificar`) e só depois a revisão dupla para o que é semântico. Não use em rascunho interno, pesquisa exploratória nem em tarefa com verificação determinística.

## Explicar a mudança antes do merge

Quando o autor pedir, depois do trabalho feito e da verificação, escreva em cinco blocos curtos o que ele precisa saber para explicar a mudança: por que existe, o que mudou, trade-offs (o que foi escolhido, adiado ou descartado), riscos considerados e o que o time precisa saber para manter. Se o autor quiser testar o entendimento, faça até cinco perguntas de múltipla escolha, uma por vez, sobre o porquê e o efeito da mudança, nunca sobre nome de função ou número de linha. Passar nessa checagem não aprova o merge nem substitui teste e review.

## Histórico de rodadas de uma PR

O histórico de uma PR fica na pasta de registros da entrega. Use `scripts/reviews.mjs` com `--repo`, `--numero` e, quando houver, `--chave`.

1. Ao abrir uma PR para revisar, leia o histórico:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/reviews.mjs" ler --repo frete-api --numero 12 --chave PROJ-7
```

2. Da segunda rodada em diante, confira cada item aberto contra o código atual e marque `resolvido` ou mantenha `aberto`, com `reviews.mjs atualizar --id C-1 --status resolvido`. Em código que já passou por review, não levante item novo: só o diff desde a última rodada entra.
3. Grave itens novos (`reviews.mjs item`) e a rodada (`reviews.mjs rodada --commit <sha> --resultado "PEDIR MUDANÇAS"` ou `APROVAR`) só depois de o autor aprovar o texto dos itens.


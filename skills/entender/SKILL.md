---
name: entender
description: Transforma requisito vago, ideia ou pedido ambíguo em escopo claro e critérios de aceite verificáveis, perguntando uma coisa por vez e lendo o código antes de perguntar o que ele já responde. Use quando o pedido é vago, o resultado esperado não é observável, ou a mudança toca segurança, dado persistente, migration, integração ou contrato. Não use para pedido pequeno e claro (faça direto), correção óbvia, debug em andamento nem para escolher a abordagem técnica depois de o escopo estar fechado (ver planejar).
metadata:
  origin: omc+superpowers+ecc
---

# Entender

Quem constrói costuma achar que sabe o que o autor quer, e esse achar é mais fino do que parece. Esta skill descobre o que ele quer de fato, e por quê, antes de qualquer coisa ser construída. Quando você entende o porquê, as cem decisões que o autor nunca menciona saem como ele tomaria.

Termina em escopo e critérios de aceite aprovados. Não escolhe a abordagem técnica nem implementa: depois da aprovação, o orquestrador segue para `planejar`.

## Comece pelo que você já sabe

- Tudo o que importa está no pedido ("troca a cor do ícone para azul-claro"): é tarefa rápida e clara. Faça e diga o que fez.
- Falta algo não trivial (o resultado esperado, o motivo, o limite, o critério de pronto): comece a conversa.
- O autor pode dizer "pula as perguntas e faz". Se disser, a skill acaba: diga numa linha as escolhas relevantes que você assumiu (stack, abordagem) e siga o fluxo normal.

## Antes de perguntar, leia

Pergunta cuja resposta está no repo, no card, no documento técnico ou no Figma não se faz ao autor. Antes, leia o código e os documentos ligados (veja `explorar`). Quando a pergunta ainda for necessária, cite a evidência que a motivou: "achei middleware JWT em `src/auth/` (passport e JWT): essa feature deve estender esse caminho ou divergir dele?".

O repo mostra como o sistema se comporta hoje, não o que o negócio exige. Regra de negócio, obrigação legal, SLA contratual, preço, retenção de dado, prioridade e público-alvo não se deduzem de código nem de nome de variável. Trate como desconhecido até o autor ou um documento de produto (PRD, contrato, política) dizer, e liste como suposição a confirmar, nunca como fato descoberto.

## A conversa

1. A primeira mensagem, em umas 200 palavras, devolve o pedido com as suas palavras (o que ele quer, para quem e por quê, até onde ele disse), junta o que a leitura achou (como a parte envolvida funciona hoje e o que a mudança toca) e aponta o que ele pode não ter considerado e mudaria o pedido: uma restrição, um conflito, um caminho mais barato. Termina convidando a corrigir e com uma pergunta:
   - se ele não disse por que quer isso, mesmo que dê para adivinhar, pergunte o porquê, aberta e ancorada num caso real ("em que momento você sente falta disso?", "me conta a última vez que isso deu problema");
   - se disse, pergunte a lacuna que mais muda o que vai ser construído;
   - se nada muda o resultado, proponha o escopo e os critérios e peça aprovação.
2. Só pergunte o que muda o que vai ser construído e que nem o pedido nem o repo respondem. O resto vira proposta sua, com o motivo, que o autor pode corrigir. Uma pergunta por mensagem, em uma frase, sem lista de exemplos pendurada. Linguagem simples, no vocabulário do autor.
3. Mire o ponto mais fraco: o que ainda impede de escrever um critério testável. Diga em uma frase por que a próxima pergunta é essa.
4. Perguntas que expõem suposição valem mais que perguntas que coletam lista de features:
   - "o que acontece exatamente quando...?";
   - "se só pudesse fazer bem uma dessas, qual?";
   - "o que te faria torcer o nariz se eu errasse?";
   - "como saberíamos que funcionou? o que te faria dizer que é isso?".
   Um palpite que o autor corrige ("imagino que é porque X morde você toda vez, certo?") costuma render mais que a pergunta.
5. Território a cobrir, sem ler como roteiro: o que é a coisa e o que a faz especial, por que agora e como é sucesso, objetivos, não objetivos e antiobjetivos (o que seria falha mesmo funcionando), o que existe hoje e o que já foi tentado, os detalhes que o autor valoriza, e como será feito (que escolhas ele quer tomar e quais entrega a você).
6. Escolha técnica que você tomar entra como decisão sua, nunca como algo que o autor aprovou.
7. Se o escopo continua nebuloso (os substantivos mudam a cada resposta, o autor descreve sintomas), faça uma pergunta de essência: "qual é a coisa central aqui, e quais são só visões ou contêineres dela?".
8. Alterne devolução e pergunta. Assim que entender uma parte bem o bastante para descrevê-la, devolva em 200 a 300 palavras e termine perguntando o que está errado ou faltando. Marque o que é palpite seu; só o que o autor disse entra como dele.
9. Depois de uns 10 rounds sem convergir, pergunte se segue com o que há ou continua. Após a terceira rodada, aceite sem resistência um "chega, pode fazer", mostrando o que ficou em aberto e o risco.
10. Quando a pergunta depende de decisão que só o autor toma e você roda como subagent, devolva o bloco DÚVIDA de `rules/orquestrador.md` em vez de escolher.

## Lacunas que valem uma pergunta

Para cada requisito: está completo, é testável, é sem ambiguidade? Procure:

- perguntas que ninguém fez e por que importam;
- limites sem definição, com uma proposta de valor (tamanho, tempo, quantidade);
- onde o escopo tende a crescer e como evitar;
- suposições sem validação e como validar;
- critério de aceite que falta;
- casos de borda por impacto e probabilidade, não os cinquenta possíveis.

Item específico, não vago: "o erro de `createUser()` com e-mail já existente não está especificado: devolve 409 ou atualiza em silêncio?".

## Dimensione o trabalho

| Tamanho | Descrição | Depois |
| --- | --- | --- |
| tarefa pequena e clara | o próprio pedido | fazer |
| mudança pequena | descrição no chat | construir pelo fluxo normal |
| projeto ou mudança de risco | critérios de aceite escritos (ou documento técnico) | `planejar` |

Cresceu no meio: pare, diga, suba um tamanho. Se são vários projetos independentes, combine a ordem e trate um de cada vez.

## Critérios de aceite

Use o menor formato útil.

Captura rápida (mudança clara, risco baixo ou médio): objetivo em uma frase, dentro e fora do escopo, suposições, de 3 a 7 critérios com método de verificação, e perguntas bloqueantes se houver.

Brief completo (ambíguo, entre sistemas, segurança, dado persistente, migration, compliance, custo alto): acrescente contexto (fatos descobertos no repo separados das restrições de negócio informadas pelo autor), risco por área e decisões bloqueantes.

Cada critério é `AC-001`, `AC-002` e assim por diante, com o que é observável:

```
AC-001: o export gera arquivo com os cabeçalhos corretos
- Cenário: usuário autenticado, ao menos uma linha visível
- Ação: clicar em "Exportar CSV"
- Esperado: o navegador baixa arquivo com as colunas [id, nome, criado_em]
- Não pode: expor campo interno nem linha de outro usuário
- Verificação: teste de integração automatizado e conferência manual do schema
- Prioridade: obrigatório
```

Palavras como "corretamente", "seguro", "rápido", "intuitivo" e "robusto" só ficam se vierem com evidência observável ou marcadas como julgamento humano. Cubra só as fronteiras que se aplicam: caminho feliz, validação, autorização e privacidade, persistência e migration, compatibilidade de contrato, recuperação de falha, idempotência e concorrência, desempenho, UX e acessibilidade.

Teste automatizado é evidência, não verdade; onde a automação não alcança (UX, acessibilidade, segurança, regra legal), a verificação pode ser manual. Nenhum segredo, token ou dado pessoal real entra em critério, exemplo ou fixture: use valor sintético. Não rode teste destrutivo nem operação contra produção sem autorização e ambiente seguro identificado.

Se a spec já existe (PRD, card, plano), revise-a em vez de recomeçar: aponte limite de escopo faltando, suposição insegura, contradição e requisito não verificável, e devolva critérios corrigidos ou complementares.

Critério que não dá para cumprir por restrição descoberta na implementação não some em silêncio: marque `[revisado]`, diga a restrição, ajuste, e reapresente só o que mudou.

## Porta de aprovação

Nada é construído antes de o autor aprovar a descrição completa: no chat para mudança pequena, no documento para projeto. Construir inclui código de produto, scaffolding, instalar dependência e criar projeto. Ler e explorar pode. Um protótipo descartável que o autor aceitou pode ser feito, rotulado como descartável; mantê-lo é um pedido novo que volta por aqui. "Parece bom" cobre o que você mostrou, não a descrição que ainda não escreveu.

Exige confirmação explícita antes de seguir só quando uma decisão em aberto pode causar exposição de segurança, perda de dado, migration irreversível, quebra de contrato com outro serviço, custo relevante ou ação destrutiva externa. No resto, registre as suposições e prossiga.

Documento escrito vai para onde o autor ou o repo mandarem (card, documento técnico, `docs/`), nunca para um lugar que você inventou.

## Registrar

Cada resposta do autor que fecha uma questão vira decisão da entrega. Alternativa que ele descartou vira abordagem:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" registrar PROJ-7 decisao "export só das linhas filtradas, sem agendamento"
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" registrar PROJ-7 abordagem "export por e-mail descartado: o autor quer download direto"
```

Sem entrega definida, use `_geral`. O que já está em `decisoes.md` não se reabre.

## Sinais de alerta

| Pensamento | Realidade |
| --- | --- |
| "vou oferecer opções para poupar esforço dele" | opção conduz; peça primeiro que descreva |
| "vou assumir um default razoável" | ótimo, diga em voz alta: default que ele nunca ouviu não pôde recusar |
| "vou explicar o processo antes" | faça a pergunta; o processo se mostra sozinho |
| "ele disse 'parece bom' para a ideia" | a aprovação cobre o que foi mostrado |
| "o protótipo funcionou, sigo construindo em cima" | manter é pedido novo, volta pela porta |

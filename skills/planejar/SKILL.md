---
name: planejar
description: Transforma um escopo já entendido em plano de implementação por tarefas pequenas e testáveis, com opções e trade-offs, arquivos, interfaces e comandos de verificação, e submete o plano a uma crítica separada antes de o autor aprovar. Use quando o escopo está claro e falta decidir como fazer e em que ordem, ou quando o autor pede para planejar ou quebrar em passos. Não use para escopo vago (ver entender), para implementar o plano nem para tarefa de poucos minutos que cabe numa frase.
metadata:
  origin: omc+superpowers
---

# Planejar

Escreva o plano para quem não conhece este código nem a spec. Essa pessoa escreve código idiomático assim que sabe a interface exata e o teste exato, e faz uma escolha razoável onde o plano deixa uma em aberto. O que ela não pode saber é o que você decidiu: quais arquivos, quais nomes e assinaturas, quais valores da spec, qual teste prova cada tarefa. Documente isso. DRY, YAGNI, TDD, commits frequentes.

Planejar não implementa. Quando o autor diz "faz X", leia como "planeja X". O plano termina num ponto de parada: o autor revisa, aprova e escolhe a execução. A aprovação do plano não autoriza commit, push nem PR; esses têm a própria parada.

## Antes de escrever

Para decisão de arquitetura, o orquestrador chama o agent `architect` (só leitura) antes de escrever o plano.

1. O escopo e os critérios de aceite estão fechados? Se não, volte para `entender`. Decisões que o autor já tomou estão nos registros da entrega e não se reabrem.
2. Pergunta cuja resposta está no código não vai ao autor: use `explorar`. Só pergunte prioridade, prazo, escopo e tolerância a risco, uma pergunta por vez.
3. Se o escopo cobre vários subsistemas independentes, proponha planos separados, um por subsistema, cada um entregando software que funciona e se testa sozinho.
4. Releia a spec e os critérios para detectar lacuna antes de planejar (limite sem valor, caso de borda sem decisão, suposição sem validação). O que for decisão do autor volta como pergunta.

## Opções e trade-offs

Para decisão com mais de um caminho viável, mostre pelo menos duas opções, cada uma com prós e contras limitados, e recomende uma com o motivo em uma linha. Se só uma sobrevive, diga por que as outras foram invalidadas. Alternativa descartada aparece com o motivo em uma linha.

Escolha os três fatores que mais pesam (risco para outros serviços, esforço, reversibilidade) e use-os para comparar. Para a opção favorita, escreva a melhor objeção contra ela (a versão mais forte do argumento contrário) e pelo menos uma tensão real de trade-off. Se a objeção não tem resposta, a decisão pode estar errada.

Cada recomendação cita `arquivo:linha` e diz o que sacrifica. "Considere refatorar" não é recomendação: "extrair a validação de `auth.go:42-80` para `ValidateToken()`" é.

Registre a decisão do autor e a opção descartada:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" registrar PROJ-7 decisao "cache em Redis com TTL de 10 min; invalidação por evento fica de fora"
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" registrar PROJ-7 abordagem "cache em memória do processo descartado: cada pod teria valor diferente"
```

Sem entrega definida, use `_geral`. Se o plano precisa de uma decisão que só o autor toma e você roda como subagent, devolva o bloco DÚVIDA de `rules/orquestrador.md` em vez de escolher.

## Estrutura de arquivos

Antes das tarefas, liste os arquivos que serão criados ou alterados e a responsabilidade de cada um. Unidades com fronteira clara e interface definida; arquivos que mudam juntos ficam juntos; divida por responsabilidade, não por camada técnica. Em repo existente, siga os padrões dele. Não reestruture por conta própria, mas inclua a divisão de um arquivo que já cresceu demais se ela for necessária.

## Tamanho das tarefas

Tarefa é a menor unidade que tem o próprio ciclo de teste e merece o portão de um revisor. Setup, configuração e documentação entram na tarefa cujo resultado precisa deles. Divida só onde um revisor poderia rejeitar uma tarefa e aprovar a vizinha. Cada tarefa termina num resultado testável sozinho.

Cada passo é uma ação com resultado conferível: escrever o teste que falha, rodar e ver falhar, implementar o mínimo, rodar e ver passar, commitar (o commit continua dependendo de aprovação, ver `rules/git.md`).

## Cabeçalho do plano

```markdown
# <Nome da entrega>: plano de implementação

Objetivo: uma frase do que isso entrega.
Abordagem: 2 ou 3 frases.
Stack: tecnologias e bibliotecas relevantes.
Spec: caminho ou link da spec que o plano implementa. Quem executa lê as duas.

## Restrições globais
Requisitos do projeto inteiro (versão mínima, limite de dependência, regra de nome, texto fixo), uma linha cada, com os valores exatos copiados da spec. Cada tarefa herda esta seção.

## Foco de revisão
As entradas ou falhas que a spec sugere mas nenhum teste de tarefa exercita e que têm mais chance de dar problema: a condição e o comportamento esperado, a mais provável primeiro. Cada linha ganha um teste na tarefa dona do código.
```

Onde salvar: onde o autor ou o repo indicarem; sem indicação, `docs/plans/AAAA-MM-DD-<tema>.md`. Não escreva plano em lugar que você inventou.

## Estrutura de cada tarefa

````markdown
### Tarefa N: <componente>

Arquivos:
- Criar: `caminho/exato/arquivo.go`
- Alterar: `caminho/exato/existente.go:123-145`
- Teste: `caminho/exato/arquivo_test.go`

Interfaces:
- Consome: o que usa das tarefas anteriores, com assinaturas exatas
- Produz: nomes e tipos exatos de que as tarefas seguintes dependem

- [ ] Passo 1: escrever o teste que falha (nome e assertions, com os valores exatos da spec)
- [ ] Passo 2: rodar `go test ./pkg -run TestNome` e ver FAIL por função inexistente
- [ ] Passo 3: implementar `func Nome(entrada Tipo) (Resultado, error)` em `caminho/arquivo.go`
- [ ] Passo 4: rodar e ver PASS
- [ ] Passo 5: commit (com aprovação do autor)
````

Quem executa uma tarefa só vê a própria tarefa. O bloco Interfaces é como ele fica sabendo os nomes e tipos que as vizinhas usam.

## O que cabe num passo

Um passo está pronto quando quem implementa só consegue escrever uma coisa razoável a partir dele. Basta ser sem ambiguidade, não ser completo.

- Passo de teste: nome e assertions, como código, com os valores exatos da spec.
- Passo de código: assinatura exata (nome, parâmetros, retorno), o arquivo e os valores que a spec fixa. O corpo é de quem implementa, salvo algoritmo que a assinatura e os testes não determinam.
- Passo de verificação: o comando e a saída que significa passou.
- Referência a outra tarefa: o bloco Interfaces dela diz o que usar; o plano não repete o código dela.

Plano é o conjunto de decisões que o implementador não toma sozinho. Plano maior que o código que descreve escreveu o código. Linha que não decide nada ("a definir", "tratar casos de borda", "validar adequadamente", "escrever testes do acima", tipo ou função que nenhuma tarefa define) é a falha oposta.

Plano de 3 a 6 tarefas com critério de aceite verificável costuma ser o ponto certo para mudança média; 30 micropassos é plano velho antes de pronto, e "implementar a feature" não é plano.

## Em risco alto

Para mudança de alto risco (dado, migration, segurança, contrato com outros serviços), acrescente:

- pré-mortem: assuma que o plano foi executado exatamente como escrito e falhou; liste de 3 a 7 cenários concretos e confira que o plano trata cada um;
- plano de teste ampliado: unitário, integração, e2e e observabilidade (log, métrica, alerta);
- análise de rollback: se o passo N falha no meio, qual é o caminho de volta, e ele está escrito ou foi suposto?

## Autorrevisão

Depois de escrever, confira o plano contra a spec, você mesmo, sem delegar:

1. Cobertura: aponte uma tarefa para cada requisito da spec. Requisito sem tarefa vira tarefa.
2. Varredura de passos: cada passo deixa uma só escrita razoável, e nenhum carrega mais que isso.
3. Consistência de tipos: nomes e assinaturas das tarefas posteriores batem com os das anteriores (`clearLayers()` na tarefa 3 e `clearFullLayers()` na 7 é bug).
4. Foco de revisão: cada entrada ou falha que a spec sugere tem teste numa tarefa. Seção vazia significa que você conferiu e não achou.
5. Proporção: plano várias vezes maior que a spec é transcrição do programa. Troque corpos por assinaturas, nomes de teste e assertions.

Corrija o que achar e siga.

## Crítica separada

A crítica abaixo fica com o agent `critic`, que critica o plano antes da parada.

Quem escreveu o plano não o aprova. Para plano de mudança média ou grande, o orquestrador dispara um passe de crítica com contexto limpo (um subagent, que lê o plano e a spec, sem o seu raciocínio). A crítica procura, no plano, o que está faltando e não só o que está errado:

- previsões antes de ler a fundo: de 3 a 5 áreas com mais chance de problema, que depois são investigadas uma a uma;
- verificar cada referência: todo arquivo, função e API citados existem, lendo a fonte;
- suposições explícitas e implícitas, cada uma classificada como verificada, razoável ou frágil (as frágeis são o alvo principal);
- dependências: ordem implícita, dependência circular, hand-off faltando;
- ambiguidade: dois desenvolvedores competentes interpretariam o passo de modo diferente?
- viabilidade: quem executa tem acesso, conhecimento e permissão para fazer cada passo sem perguntar?
- simular cada tarefa: um desenvolvedor que seguisse só o plano chegaria ao fim ou bateria numa parede não documentada?
- a visão de quem executa, do interessado (o plano resolve o problema declarado? critério mensurável?) e do cético (qual o argumento mais forte de que isso falha?).

Cada problema tem severidade: bloqueia a execução, causa retrabalho grande ou é subótimo mas funciona. Os dois primeiros trazem evidência (trecho do plano ou `arquivo:linha`) e correção concreta. Antes de entregar, descarte o problema de baixa confiança ou que o autor refutaria na hora com contexto que o crítico não tem, e reavalie a severidade pelo pior caso realista, com o que mitiga. Plano sem problema recebe "sem problemas"; não se inventa.

Aplique as correções e entregue ao autor a versão revisada.

## Fechamento

Salve o plano e entregue ao autor: o caminho, o escopo (quantas tarefas, quantos arquivos, complexidade baixa, média ou alta) e as entregas principais. Pergunte se o plano captura o que ele quer e como ele quer executar: tarefa por tarefa com um subagent novo e um revisor para cada uma (mais rigoroso, custa um contexto por tarefa), ou tudo na sessão principal e um revisor no fim (mais barato, sem revisão independente até o final). Recomende uma, com uma frase tirada do plano: o quanto as tarefas dependem das interfaces umas das outras, quantas são, quanto custa um erro que chegue ao fim. A última frase da mensagem é a pergunta. Não comece a implementar antes da resposta.

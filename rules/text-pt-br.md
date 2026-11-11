## Linguagem técnica em PT-BR (anti-AI-slop)

### Escopo

Vale para todo texto em português produzido no trabalho de engenharia: planos, specs, mensagens de commit, descrições de PR, comentários de código, comentários de code review, issues no Jira, documentação e mensagens técnicas em chat.

O objetivo é que o texto pareça escrito por um engenheiro sênior brasileiro, não uma tradução do inglês nem saída genérica de LLM.

### Regra central

Escreva como se escreve num time de engenharia no Brasil:

* estrutura de frase em português natural;
* termos consolidados de software em inglês, sem tradução forçada;
* nomes de código (funções, campos, arquivos, flags) exatamente como estão no código.

Não traduza literalmente só para manter o texto "100% em português". Também não deixe em inglês o que tem forma natural em português: "tratar o erro", não "handlear o erro"; "lançar exceção", não "throwar".

### Termos que ficam em inglês

Lista exemplificativa, por área. Use conforme o contexto e o vocabulário que o time já usa.

* **Testes:** mock, stub, fake, test double, fixture, suite, spec, integration test, e2e, snapshot, flaky.
* **Código e arquitetura:** handler, middleware, usecase, service, repository, caller, callback, wrapper, helper, hook, pipeline, feature flag, early return, hot path, boilerplate.
* **HTTP e integração:** endpoint, request, response, payload, header, status code, timeout, retry, rate limit, cache, webhook.
* **Resiliência:** fallback, fail-open, fail-closed, fail-soft, circuit breaker, backoff, idempotente.
* **Processo:** commit, branch, merge, rebase, deploy, rollback, release, build, PR, code review, hotfix, backlog.
* **Dados:** parse, schema, migration, seed, batch, stream, log, trace.

Verbos aportuguesados (commitar, mergear, deployar, buildar, mockar, parsear, logar) são naturais em chat e em comentário de PR. Em spec, documentação e mensagem de commit, prefira a forma neutra: "fazer merge", "fazer o deploy", "fazer parse".

Formatação:

* nome de código vai em crase: `recalcularFreteComDesconto`, `TemSeguro`, `--dry-run`;
* termo em inglês consolidado vai em texto corrido, sem crase, aspas ou itálico: "o handler faz retry três vezes";
* artigo de termo em inglês: use o que o time já usa ("a request" ou "o request") e mantenha o mesmo no texto inteiro.

### Traduções literais e AI-slop

Troque as expressões da esquerda pelas da direita. A lista é exemplificativa; aplique o mesmo critério a qualquer expressão que pareça tradução literal ou preenchimento.

**Tradução literal de jargão**

| Evite | Prefira |
| --- | --- |
| achado, achado acionável | item do review, problema, caso, o conceito concreto |
| desfecho | status, estado, resultado, decisão |
| honrar (o contrato, a flag) | respeitar, considerar, usar |
| duplo de teste, duplo de serviço | fake, mock, stub, test double |
| predicado | helper, função de verificação (salvo quando o termo for técnico de fato) |
| degradar para X | fazer fallback para X |
| rota quente | hot path, endpoint muito acessado |
| recusa de negócio | erro de negócio, rejeição por regra de negócio |
| consumir uma tentativa | contar como tentativa, gastar a tentativa |
| guard de regressão | teste de regressão |
| fixar o contrato, fixar o comportamento | garantir, cobrir, testar esse comportamento |
| janela cheia | o TTL ou período concreto do rate limit |
| o problema mora em | o problema está em |
| endereçar o problema | tratar, resolver, corrigir |
| alavancar | usar, aproveitar |
| tornar X ciente de Y | passar Y para X, X passa a receber Y |
| performar | ter desempenho, rodar, executar |
| orquestrar (quando é só chamar em ordem) | chamar, coordenar |
| trazer visibilidade | logar, expor métrica, mostrar na tela |

**Falsos cognatos**

| Evite | Prefira |
| --- | --- |
| eventualmente (de *eventually*) | no fim, em algum momento. Em português, "eventualmente" significa "ocasionalmente" |
| atualmente (de *actually*) | na verdade |
| assumir que (de *assume*) | supor, presumir, partir do princípio de que |
| realizar que (de *realize*) | perceber, notar |
| suportar (de *support*, no sentido de aceitar) | aceitar, ter suporte a. "Suporta HTTP/2" é aceitável; "não suporta esse input" fica ambíguo |

**Preenchimento sem informação**

| Evite | Prefira |
| --- | --- |
| robusto, resiliente, sólido | o comportamento concreto: "tolera timeout do provider", "não perde a fila ao reiniciar" |
| abrangente, aprimorar, otimizar (sem medida) | o que mudou e quanto |
| garantir a integridade dos dados | qual invariante é garantida |
| de forma eficiente, eficaz, transparente | remova, ou diga o que o caller não precisa mais fazer |
| melhores práticas, estado da arte | cite a prática ou remova |
| mergulhar em, explorar, desbloquear, navegar | remova |

**Conectores e frases de LLM**

Remova quando não acrescentam informação: "Dessa forma", "Com isso", "Essa abordagem permite", "É importante notar", "Vale ressaltar", "Vale destacar", "Cabe mencionar", "É crucial", "É fundamental", "Neste contexto", "No cenário atual", "Em suma", "Em resumo", "Por fim".

Também são sinais de texto gerado:

* negrito espalhado em frases inteiras;
* lista onde um parágrafo de duas frases resolve;
* cabeçalho em texto de dez linhas;
* emoji em texto técnico;
* resumo final repetindo o corpo;
* "Espero que ajude", "Fico à disposição".

### Estilo

Prefira:

* frases curtas, uma ideia por frase;
* verbos concretos: usa, lê, grava, retorna, lança, ignora, recalcula;
* nomes específicos: a função, o campo, o serviço. Não "o componente responsável por";
* causa e efeito direto: "X porque Y", "sem isso, Z";
* voz ativa quando o agente importa: "decidimos", não "foi decidido";
* vocabulário do próprio código e do projeto.

Evite:

* abstrações desnecessárias;
* linguagem acadêmica;
* sinônimos sofisticados para conceitos simples;
* explicar o óbvio;
* repetir a mesma conclusão em frases diferentes;
* introduções e conclusões genéricas;
* hedging vazio: "pode ser que talvez", "possivelmente pode".

### Por tipo de texto

**Mensagem de commit**

Conventional Commits, imperativo, minúsculas, sem ponto final. Corpo só quando o motivo não é óbvio pelo diff.

```
fix(pedido): usa preço do pacote como base do total sem seguro

A shipping-api retorna o preço do pacote já com seguro, apesar do
nome do campo. O total sem seguro ficava maior que o total com seguro.
```

Ruim: `fix: correção robusta no cálculo de totais do pedido conforme alinhado`.

**Descrição de PR**

Se o repositório tem template de PR, siga o template: as seções e o checklist dele são a estrutura, e as regras deste arquivo valem para o texto dentro de cada seção. Seção opcional que não se aplica sai, e checklist do template não conta como "checklist genérico".

Sem template, use estas seções, só as que tiverem conteúdo:

* `## Contexto`: qual era o problema ou a necessidade, com link do card e, em PR empilhada, a ordem da pilha e a base;
* `## O que muda`: agrupado por área ou fluxo, cada grupo com rótulo em negrito (e o arquivo principal em crase, se ajudar) e bullets curtos embaixo;
* `## Como testar`: pré-condições (flags, env) e passos numerados com o resultado esperado. Quando a PR cria ou muda endpoint, inclua um bloco `bash` com o `curl` de exemplo de cada rota (URL local, headers de autenticação com placeholder no lugar do segredo, corpo quando houver) e o trecho da response que confirma a mudança;
* `## Pontos em aberto`: o que ficou fora, dúvida de produto ou design, risco ainda não medido;
* `## Verificação`: lint, typecheck, testes e CI, só o que de fato rodou.

Sem checklist genérico e sem narrar o diff arquivo por arquivo.

Número do ticket, IDs usados na investigação e ambiente onde o bug foi reproduzido ficam aqui, nunca no código (ver comments.md).

**Comentário de code review**

Aponte o problema e o efeito concreto, depois a alternativa. Separe bloqueante de sugestão.

Ruim: "Talvez valesse a pena revisitar essa abordagem para torná-la mais robusta."

Melhor: "Se `TemSeguro` vier nil, isso retorna zero e o total fica menor que o sem seguro. Sugiro retornar `false` no segundo valor e tratar no caller."

Sugestão não bloqueante leva o prefixo `nit:`.

**Comentário de código**

Segue as regras de comments.md. Explica o porquê, uma restrição ou uma decisão. Nunca narra o código nem carrega histórico.

**Plano e spec**

Decisões e trade-offs, não prosa. Cada seção responde uma pergunta concreta: o que muda, por quê, o que fica fora, como validar. Alternativa descartada aparece com o motivo em uma linha.

### Exemplo

Antes:

> Esta PR endereça um achado identificado durante a análise do fluxo de promoções. Foi implementada uma abordagem robusta que honra o contrato da shipping-api, garantindo a integridade dos totais. Dessa forma, o desfecho do cálculo passa a ser consistente. Vale ressaltar que foi adicionado um guard de regressão.

Depois:

> A shipping-api retorna o preço do pacote já com seguro, mas o campo se chama `PrecoUnitarioPacoteSemSeguro`. O total sem seguro usava esse valor e saía maior que o total com seguro. O cálculo passa a usar `PrecoUnitarioPacote` como base. Teste de regressão cobre pacote com e sem seguro adicional.

### Checagem final

Antes de finalizar qualquer texto em português, responda:

1. Um engenheiro sênior brasileiro escreveria isso espontaneamente em um PR ou code review? Se não, reescreva de forma mais simples e direta.
2. Cada frase diz algo que a anterior não disse? Se não, apague a repetição.
3. Se apagar os adjetivos e conectores, o texto perde informação? Se não, apague-os.

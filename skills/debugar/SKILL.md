---
name: debugar
description: Investiga bug, teste que falha, comportamento inesperado, regressão ou erro de build até achar a causa raiz, antes de propor correção; em causa ambígua, compara hipóteses concorrentes com evidência a favor e contra. Use quando algo quebra e a causa não é óbvia, ou quando uma correção já falhou. Não use para pedir feature, para erro cuja causa e correção já estão na mensagem nem para revisar código sem sintoma.
metadata:
  origin: omc+superpowers
---

# Debugar

Regra central: nada de correção sem causa raiz. Corrigir sintoma gera um ciclo de remendos: pôr checagem de nulo em todo lugar quando a pergunta certa é por que o valor está nulo. Vale mais para urgência, caso "óbvio" e quando a primeira tentativa não funcionou. Investigar é mais rápido que tentar no escuro.

Esta skill termina na causa e na correção mínima recomendada. Aplicar a correção é outra etapa e o orquestrador para antes dela, a menos que o autor já tenha pedido a correção.

## Fase 1: causa raiz

Antes de qualquer correção:

1. Leia a mensagem de erro inteira e o stack trace completo, não só a primeira linha. Anote arquivo, linha e código de erro.
2. Reproduza. Qual o passo mínimo que dispara? Acontece sempre ou de vez em quando? Se não reproduz, colete mais dado (logs, condições, entrada) em vez de chutar.
3. Veja o que mudou: `git log`, `git diff`, `git blame` na área afetada, dependência nova, config, diferença de ambiente.
4. Em sistema com vários componentes (API, service, banco, fila), instrumente cada fronteira antes de propor correção: o que entra, o que sai, se a config chegou. Uma execução mostra em qual camada quebra; só então investigue aquela camada.
5. Siga o dado para trás: onde o valor ruim nasce, quem o passou, e assim até a origem. Corrija na origem, não onde o erro estourou.

## Fase 2: padrão

- Ache código parecido que funciona no mesmo repo e liste toda diferença com o que quebra, por menor que pareça.
- Se está implementando um padrão, leia a referência inteira, linha a linha.
- Entenda as dependências: config, ambiente, premissas do trecho.

## Fase 3: hipótese e teste

1. Escreva uma hipótese só: "acho que X é a causa porque Y". Específica, não vaga.
2. Teste com a menor mudança possível, uma variável por vez.
3. Funcionou: siga para a fase 4. Não funcionou: formule outra hipótese, sem empilhar correção em cima.
4. Quando não souber, diga "não entendi X". Não finja.

Anote cada hipótese descartada com o motivo. Ela evita refazer a mesma investigação depois:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/registros.mjs" registrar PROJ-7 abordagem "hipótese: <X>. descartada porque <evidência>"
```

Sem chave de entrega definida, use `_geral`.

## Causa ambígua: hipóteses concorrentes

Quando o sintoma admite explicações diferentes, não escolha a favorita cedo. Separe observação de interpretação e monte o quadro:

1. Observação: o que foi visto, sem interpretar.
2. Pelo menos duas hipóteses deliberadamente diferentes (por exemplo: caminho de código; config ou ambiente; artefato de medição ou premissa errada na própria verificação).
3. Para cada uma, evidência a favor e evidência contra ou lacuna. Cite `arquivo:linha`.
4. Evidência tem peso, da mais forte para a mais fraca:
   1. reprodução controlada ou experimento direto;
   2. artefato primário com origem clara (log com timestamp, métrica, config, histórico do git, comportamento em `arquivo:linha`);
   3. várias fontes independentes convergindo;
   4. inferência de uma fonte só, pelo caminho do código;
   5. indício circunstancial (nome, proximidade de tempo, posição na stack);
   6. intuição e analogia.
5. Tente refutar a líder: que observação deveria existir se ela fosse verdadeira, e ela aparece? Que observação seria difícil de explicar com ela? Rebaixe a hipótese contradita por evidência mais forte, que só se sustenta com suposição nova não verificada, ou que não faz previsão distinta das rivais.
6. Aponte a incógnita crítica e a sonda que separa as duas melhores hipóteses com menor esforço.

Nunca declare convergência só porque duas hipóteses usam palavras parecidas: converge quando o mecanismo causal é o mesmo ou evidências independentes apontam para a mesma explicação.

Para vários caminhos independentes, o orquestrador pode abrir um subagent por hipótese, cada um responsável por uma só, devolvendo evidência a favor, contra, incógnita crítica e a melhor sonda. Subagent que esbarra em escolha que cabe ao autor, ou em conflito entre ADR, Figma e código, devolve o bloco DÚVIDA de `rules/orquestrador.md` em vez de decidir.

Quadro de saída:

```
Observação: ...
| Posição | Hipótese | Confiança | Força da evidência | Por que continua plausível |
Evidência contra ou lacunas: ...
Explicação atual: ...
Incógnita crítica: ...
Sonda discriminante: ...
```

## Fase 4: correção

1. Escreva um teste que falha e reproduz o bug, o mais simples possível. Para fazê-lo direito, siga a skill `testar`.
2. Uma correção só, na causa raiz. Sem "já que estou aqui", sem refactor junto.
3. Verifique: o teste passa, nada mais quebrou, o problema sumiu de fato. Antes de dizer "resolvido", siga a skill `verificar`.
4. Procure o mesmo padrão em outros pontos do código.
5. Se a correção não funcionou, pare e conte quantas já tentou. Menos de três: volte à fase 1 com o que aprendeu. Três ou mais: o problema provavelmente é de arquitetura (cada correção revela acoplamento ou estado compartilhado novo, ou pede refactor grande). Não faça a quarta tentativa: leve a discussão ao autor, com o que as três tentativas mostraram.

## Erro de build ou compilação

1. Detecte a stack pelo manifesto (`package.json`, `go.mod`, `pyproject.toml`) antes de escolher a ferramenta.
2. Colete todos os erros de uma vez.
3. Classifique: tipo, definição ausente, import ou export, configuração.
4. Corrija cada um com a menor mudança que resolve (anotação de tipo, import, dependência). Sem renomear, sem reestruturar módulo, sem mudar fluxo.
5. Verifique depois de cada correção e rode o build completo no fim, com saída zero. Reporte "X de Y erros corrigidos" ao longo do caminho.

## Sinais de que está se desviando

- "Conserto rápido agora, investigo depois."
- "Vou mudar X e ver se funciona."
- Várias mudanças de uma vez e rodar os testes.
- "Provavelmente é X" sem mostrar o acesso concorrente ou o dado.
- Correção que revela problema novo em outro lugar.
- Propor solução antes de seguir o fluxo do dado.

Qualquer um deles: volte à fase 1.

## Quando não há causa raiz

Se a investigação mostra que o problema é de ambiente, de tempo ou externo, a investigação terminou. Documente o que foi investigado, trate o caso (retry, timeout, mensagem de erro) e adicione log ou métrica para a próxima vez. Na maioria dos casos "sem causa raiz" é investigação incompleta.

## Relatório

```
Sintoma: o que o usuário vê
Causa raiz: o problema real em arquivo:linha
Reprodução: passos mínimos
Correção: mudança mínima necessária
Verificação: como provar que resolveu
Padrão parecido: outros lugares onde pode existir
Referências: arquivo:linha onde se manifesta e onde nasce
```

Cada problema cita `arquivo:linha`. A decisão tomada pelo autor ao final vira registro de decisão da entrega (`registros.mjs registrar <CHAVE> decisao "<texto>"`).

---
name: strategic-compact
description: Decide quando rodar /compact numa sessão longa, em fronteira de fase e não no meio da tarefa, e o que salvar em arquivo antes. Use quando a sessão se aproxima do limite de contexto, as respostas ficam lentas ou incoerentes, ou uma fase acabou. Não use no meio de uma implementação nem para tarefa curta.
metadata:
  origin: ecc
---

# Compactação estratégica

A compactação automática dispara em ponto arbitrário: muitas vezes no meio da tarefa, sem saber onde uma fase termina. Compactar à mão, em fronteira lógica, preserva o que importa e descarta o resto.

## Quando compactar

| Transição | Compactar? | Motivo |
| --- | --- | --- |
| pesquisa para planejamento | sim | a pesquisa é volumosa; o plano é o resultado destilado |
| planejamento para implementação | sim | o plano já está escrito em arquivo; libera contexto para o código |
| implementação para teste | talvez | mantenha se o teste referencia código recente; compacte se o foco muda |
| depuração para outra feature | sim | rastro de debug atrapalha trabalho sem relação |
| meio da implementação | não | perde nome de variável, caminho de arquivo e estado parcial |
| depois de abordagem que falhou | sim | limpa o raciocínio do beco sem saída antes de tentar outra |

## O que sobrevive à compactação

| Permanece | Perde |
| --- | --- |
| instruções do CLAUDE.md | raciocínio e análise intermediários |
| arquivos em disco | conteúdo de arquivo lido antes |
| arquivos de memória | contexto de conversa de vários passos |
| estado do git (commits, branches) | histórico de chamadas de ferramenta |
| pasta de registros da entrega | preferência dita só de passagem, em conversa |

A lista de tarefas pode não existir nem sobreviver, dependendo da versão e do modelo. Não a trate como registro durável.

## Antes de compactar

1. Escreva em arquivo o que precisa continuar: o plano, a abordagem escolhida, os caminhos dos arquivos tocados, o que falta. Decisão e abordagem descartada vão para os registros da entrega (`registros.mjs registrar`), que o hook reinjeta quando a chave aparece no pedido.
2. Confira `git status`: o que está em disco e commitado não depende do contexto.
3. Rode `/compact` com uma instrução de foco, para o resumo guardar o que importa:

```
/compact Foco: implementar o middleware de autenticação conforme o plano em docs/plano.md
```

## Boas práticas

- Compacte depois que o plano estiver finalizado e escrito em arquivo.
- Compacte depois de resolver um bug, antes de seguir para outro assunto.
- Não compacte no meio de uma implementação.
- Preferência que o autor disse só em voz alta e precisa durar vai para a memória ou para o CLAUDE.md antes.
- Se o contexto está pesado por causa de leituras grandes, delegue a leitura a um subagent em vez de compactar: ele devolve só a conclusão.

## O que pesa no contexto

- CLAUDE.md e regras sempre carregados: mantenha enxutos.
- Skills carregadas: cada uma custa de 1 a 5 mil tokens.
- Resultado de ferramenta: arquivo lido inteiro, saída longa de busca ou de teste.
- Instruções duplicadas: a mesma regra em `~/.claude/rules/` e na do projeto, ou skill repetindo o que o CLAUDE.md já diz.

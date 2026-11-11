## Code review de PR

Vale para `/code-review` e para qualquer review de PR ou diff que for pedido. Um review só é útil se o time lê o que ele aponta. Por isso ele deve listar pouca coisa, e só o que importa.

### O que reportar

Só item bloqueante, ou seja, algo que, se for para produção como está:

- quebra em runtime (panic, exceção não tratada, nil/undefined, deadlock, loop infinito);
- gera ou grava dado errado (cálculo, regra de negócio, migration, estado inconsistente);
- abre brecha de segurança (authz/authn, injeção, vazamento de dado, segredo no código);
- quebra contrato com outro serviço ou com o front (payload, status code, schema, fila, evento, tabela compartilhada).

Cada item precisa de um cenário concreto: entrada ou estado, o que acontece e o efeito. Se não houver como descrever esse cenário, o item não entra.

### O que não reportar

- naming, estilo, formatação, ordem de imports;
- refactor opcional, "poderia extrair", "poderia simplificar";
- teste faltando, exceto quando a falta esconde um item bloqueante;
- preferência de design sem efeito em comportamento;
- problema que já existia antes da PR. Se for grave, cito numa linha à parte, fora dos comentários da PR, como sugestão de card separado.

Na dúvida se um item é bloqueante, deixo de fora.

### Escopo

- Olho só as linhas que a PR introduziu ou alterou, e o código que elas afetam diretamente.
- Antes de ler o código, leio a intenção: a descrição da PR e o card do Jira (chave do card no nome da branch ou no título). O review responde primeiro se a mudança faz o que se propôs, sem efeito colateral fora disso.

### Rodar de novo na mesma PR

O review precisa convergir. Rodar de novo não pode inventar item que não estava lá.

- Antes de revisar, leio os comentários de review que a PR já tem.
- Na segunda rodada em diante, confiro só se os itens anteriores foram resolvidos e reviso o diff novo desde a última rodada.
- Não reabro discussão que o autor já respondeu ou recusou com motivo.
- Se não houver item bloqueante, digo isso e paro. Review sem item é um resultado válido.

### Formato

Postar na PR (`--comment`) só quando o autor pedir. Comentários seguem `text-pt-br.md`: problema, efeito concreto e alternativa, sem `nit:`, porque nit não entra.

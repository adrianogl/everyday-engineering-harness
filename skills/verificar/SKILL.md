---
name: verificar
description: Confere com evidência nova (testes, tipos, build, comportamento) que uma mudança cumpre os critérios de aceite antes de dizer que está pronta, corrigida ou passando, e antes de commit, push ou PR. Use ao fim de uma implementação, correção ou refactor, ou quando um subagent reporta sucesso. Não use para revisar estilo ou qualidade do código (ver review) nem para investigar a causa de uma falha (ver debugar).
metadata:
  origin: omc+superpowers
---

# Verificar

Regra central: nenhuma afirmação de conclusão sem evidência recente. "Deve funcionar" não é verificação. Se o comando de verificação não rodou nesta mensagem, não dá para dizer que passa.

Quem escreveu a mudança não aprova a si mesmo no mesmo contexto. Quando o risco é alto, a verificação roda num passe separado (subagent ou sessão limpa) que não viu o raciocínio de quem implementou.

## O portão

Antes de afirmar qualquer estado ou demonstrar satisfação:

1. Identifique o comando que prova a afirmação.
2. Rode o comando completo, agora.
3. Leia a saída inteira, o exit code e a contagem de falhas.
4. Confira se a saída confirma a afirmação. Se não, diga o estado real, com a evidência. Se sim, afirme com a evidência.
5. Só então faça a afirmação.

Pular um passo é chutar, não verificar.

## O que cada afirmação exige

| Afirmação | Exige | Não basta |
| --- | --- | --- |
| testes passam | saída do comando de teste, zero falhas | execução anterior, "deve passar" |
| lint limpo | saída do linter, zero erros | checagem parcial |
| build ok | comando de build com exit 0 | lint passando, log com cara de ok |
| bug corrigido | o sintoma original reproduzido e agora ausente | código mudou, logo "deve estar corrigido" |
| teste de regressão vale | ciclo vermelho e verde: passa, reverte a correção, falha, restaura, passa | passou uma vez |
| subagent terminou | `git diff` mostra as mudanças | o subagent disse "sucesso" |
| requisitos atendidos | checklist linha a linha contra o critério de aceite | testes passando |

## Fluxo

1. Defina o que prova que funciona: os critérios de aceite originais (do card, da ADR, do plano), os casos de borda que importam e o que pode regredir.
2. Rode, em paralelo quando der: a suíte de testes, o typecheck e o build. Procure e rode também os testes relacionados que devem continuar passando.
3. Ordem de preferência: testes que já existem, typecheck e build, comandos diretos e estreitos, validação manual ou interativa descrita passo a passo, com observação concreta.
4. Análise de lacunas, para cada critério:
   - VERIFICADO: existe teste, ele passa e cobre os casos de borda;
   - PARCIAL: existe teste incompleto;
   - AUSENTE: não há teste nem checagem.
5. Veredito: APROVADO quando todos os critérios estão verificados, sem erro de tipo, com build ok e sem lacuna crítica. REPROVADO quando qualquer teste falha, há erro de tipo, o build quebra, um caso de borda crítico não foi testado ou não há evidência. INCOMPLETO quando não existe caminho realista de verificação: diga isso em vez de blefar.

Se uma checagem falha, mostre a falha com clareza. Prefira resumo de evidência a log cru.

## Sinais de alerta

- Escrever "deve", "provavelmente", "parece".
- Comemorar antes de verificar ("pronto!", "perfeito!").
- Ir para commit, push ou PR sem verificar.
- Confiar no relato de um subagent.
- Confiar em verificação parcial ("só dessa vez", "estou cansado").
- Qualquer frase que sugira sucesso sem comando rodado, inclusive com outras palavras.

## Falhas comuns

| Falha | Em vez disso |
| --- | --- |
| aprovar porque quem implementou disse que funciona | rodar os testes você mesmo |
| usar saída de teste antiga | rodar de novo depois da última mudança |
| "compila, logo está certo" | checar o comportamento contra o critério de aceite |
| ver só a feature nova | avaliar o risco de regressão nas relacionadas |
| veredito vago ("quase tudo funciona") | APROVADO ou REPROVADO, com evidência |

## Formato do relatório

```
Veredito: APROVADO | REPROVADO | INCOMPLETO   (confiança: alta | média | baixa)
Bloqueantes: <quantidade>

| Verificação | Resultado | Comando | Saída |
| Testes | passou | `go test ./...` | 42 passaram, 0 falharam |
| Tipos | passou | `npm run typecheck` | 0 erros |
| Build | passou | `npm run build` | exit 0 |

| # | Critério | Status | Evidência |
| 1 | usuário redefine a senha | VERIFICADO | `auth_test.go:42` passa |
| 2 | e-mail enviado | PARCIAL | teste existe, não confere o conteúdo |

Lacunas: <descrição>, risco alto/médio/baixo, como fechar.
Recomendação: APROVAR | PEDIR MUDANÇAS | PRECISA DE MAIS EVIDÊNCIA, com uma frase de justificativa.
```

Reporte só o que foi de fato verificado: quais comandos rodaram, o que passou, o que falhou ou ficou sem verificar.

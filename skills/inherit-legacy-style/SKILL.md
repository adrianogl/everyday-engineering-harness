---
name: inherit-legacy-style
description: Levanta as convenções implícitas de um código legado escrito à mão, resolve os conflitos com o autor um de cada vez e grava um .ai-style-rules.md aplicável (arquivos de referência, regras de nome, o que não fazer). Use ao começar a trabalhar num repo legado cujo estilo não está escrito, ou quando o código gerado destoa do projeto. Não use em repo novo nem para julgar a qualidade do estilo.
metadata:
  origin: ecc
---

# Herdar o estilo de um legado

Evita que código novo destoe do projeto. Mede o repo, procura as convenções que ninguém escreveu, pergunta ao autor só onde há conflito de verdade e grava o consenso num arquivo que o assistente passa a seguir. Serve para qualquer linguagem. Alinha só a arquitetura do código (organização, fluxo, erro), não julga sintaxe nem escolha de stack.

## Modo

Confira se existe `.ai-style-rules.md` na raiz. Se não existe, é a primeira passada completa. Se existe, é a passada incremental. Anuncie o modo em uma linha e siga, sem perguntar.

## Primeira passada

1. Meça a escala com `git ls-files` filtrando por extensão de código:

| Porte | Arquivos | Estratégia |
| --- | --- | --- |
| pequeno | até cerca de 50 | leia tudo |
| médio | 50 a 500 | camada de infra inteira; negócio por amostra de 2 ou 3 arquivos por dimensão |
| grande | acima de 500 | amostragem estrita; comece por `--stat` e leia só o que é suspeito |

2. Escaneie quatro dimensões:
   - anatomia do arquivo: ordem das declarações (imports, tipos, lógica, helpers, export);
   - estado e fluxo de controle: nome de estado assíncrono, paginação, flags;
   - infraestrutura: onde ficam interceptors, formatters, middleware, utilitários transversais;
   - tratamento de erro: try/catch, interceptor global ou retorno de erro; hábito de checar nulo.

3. Filtre o ruído antes de interromper o autor:
   - sinal fraco (minoria abaixo de 5% e menos de 10 ocorrências): a maioria vence e a minoria vai para "não fazer";
   - sinal forte (divisão quase igual, ou bifurcação semântica numa dimensão central): pergunte;
   - em projeto pequeno (até 50 arquivos), "3 contra 2" não é maioria: pergunte.

4. Pergunte um conflito por vez, com quatro opções e a evidência:

```
Evidência: `caminhoA` usa o estilo X, `caminhoB` usa o estilo Y.
Risco: misturar os dois racha o estilo do projeto.
Escolha: 1 seguir X, 2 seguir Y, 3 é evolução, atualizar as regras, 4 tenho uma regra nova.
```

Espere a resposta antes da próxima pergunta. Nunca empilhe perguntas. Dentro de subagent, devolva o bloco DÚVIDA do orquestrador em vez de escolher.

5. Grave `.ai-style-rules.md` na raiz, com cabeçalho de hash do commit e porte, e três seções:
   - arquivos de referência: caminhos reais, cada um com o que demonstra;
   - regras de nome e de estado e fluxo: convenções concretas e verificáveis;
   - o que não fazer: antipadrões que não podem se espalhar.

6. Pergunte a força da aplicação: referência `@.ai-style-rules.md` no CLAUDE.md do projeto (recomendado), essa referência mais um hook em `PreToolUse` para `Write`/`Edit`, ou nenhuma. Não instale hook sem o autor escolher.

## Passada incremental

1. Leia o `.ai-style-rules.md` existente. Com hash no cabeçalho, `git diff <hash> HEAD --stat` mostra o que mudou desde então.
2. Leia as mudanças recentes (`git log -3 --stat`) e abra só os arquivos suspeitos. Em diff enorme, só o `--stat` e amostra dos maiores.
3. Compare o código novo com as regras. Conflito passa pelo mesmo protocolo de uma pergunta por vez.
4. Acrescente uma entrada `### [AAAA-MM-DD] Evolução do estilo` no fim do arquivo. Não sobrescreva regra antiga.

## Ao escrever código com o arquivo carregado

Antes de escrever, diga qual arquivo de referência você segue e quais itens de "não fazer" evita. Reutilize a estrutura do arquivo de referência, mas não copie os defeitos dele: aponte o defeito.

## Erros a evitar

- Pular a medição de escala: amostrar um projeto de 30 arquivos o deixa sem cobertura; ler 5 mil arquivos estoura o contexto.
- Fazer várias perguntas de conflito de uma vez.
- Sobrescrever regras na passada incremental.
- Impor hook rígido sem perguntar.
- Julgar sintaxe ou escolha de tecnologia: o escopo é só a arquitetura do código.
- Perguntar por divisão 843 contra 8: o limite de sinal resolve sozinho.

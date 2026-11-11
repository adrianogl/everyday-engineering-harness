---
name: explorar
description: Entende como uma parte do código funciona antes de mexer (onde fica X, como Y se liga a Z, fluxo de execução, camadas, dependências, padrões a seguir) e procura solução existente no repo, em dependência ou no ecossistema antes de escrever código novo. Use ao começar uma feature, ao entrar numa área desconhecida e antes de criar utilitário ou integração. Não use para pesquisar documentação externa de API (consulte a doc oficial) nem para modificar código.
metadata:
  origin: omc+ecc
---

# Explorar

Exploração é só leitura. O resultado precisa deixar quem pediu seguir sem perguntar "mas onde exatamente?" ou "e o X?". Responda à necessidade por trás do pedido, não só ao texto: "onde fica a autenticação?" pede o fluxo, não uma lista de arquivos.

## Procurar solução existente antes de escrever

Antes de criar utilitário, helper, abstração ou integração:

1. Já existe no repo? Busque nos módulos e nos testes relacionados primeiro.
2. É um problema comum? Procure em dependências que o projeto já tem (`go.mod`, `package.json`), depois no registry (npm, Go modules, PyPI).
3. Existe implementação ou template mantido em código aberto? Uma busca de código no GitHub ajuda a ver como outros resolveram.
4. A biblioteca ou o serviço tem documentação oficial? Consulte-a (Context7 ou a doc do fornecedor) em vez de lembrar de memória.

Se algum canal não está disponível (sem `gh` autenticado, sem registry), diga que não pesquisou ali. "Não achei nada" sem dizer o que não foi consultado engana.

Decida pela tabela:

| Sinal | Ação |
| --- | --- |
| acerto exato, mantido, licença permissiva | adotar |
| acerto parcial, boa base | estender com um wrapper fino |
| vários acertos fracos | compor 2 ou 3 pacotes pequenos |
| nada serve | construir, informado pela pesquisa |

Cuidado com wrapper tão grosso que a biblioteca perde o benefício, e com pacote enorme para uma função pequena.

## Mapear o código

1. Entenda a intenção: o que foi pedido de fato, o que a pessoa precisa saber e que resultado a deixa seguir.
2. Dispare 3 ou mais buscas em paralelo na primeira rodada, do amplo ao estreito. Use a ferramenta certa: Glob para nome de arquivo, Grep para texto e identificador, busca estrutural ou LSP para símbolos e referências, git para histórico (`git log -S`, `git blame`).
3. Tente nomenclaturas diferentes: camelCase, snake_case, PascalCase, siglas, e o vocabulário do projeto (o repo pode dizer "throttle" onde você buscou "rate limit").
4. Cruze o resultado em mais de uma ferramenta.
5. Limite a profundidade: se um caminho rende pouco depois de duas rodadas, pare e relate o que achou.

Proteja o contexto: veja o tamanho do arquivo antes de ler (`wc -l`). Em arquivo grande, leia o esboço de símbolos e depois só a faixa necessária com `offset` e `limit`. Prefira ferramenta estrutural a ler arquivo inteiro.

Para análise profunda de uma feature, percorra:

- pontos de entrada: o gatilho (rota, evento, job, ação do usuário) e como chega;
- caminho de execução: a cadeia de chamadas até o fim, com ramificações, fronteiras assíncronas, transformações de dado e caminhos de erro;
- camadas: quais o código toca e como se comunicam, fronteiras reaproveitáveis e antipadrões;
- padrões: abstrações, convenções de nome e de organização já em uso;
- dependências: bibliotecas e serviços externos, módulos internos, utilitários compartilhados que valem reaproveitar. Em tabela compartilhada entre serviços, veja quem mais lê e grava nela.

## Contexto para subagent

Subagent não sabe de que contexto precisa até começar. Mandar tudo estoura o limite, não mandar nada o deixa cego, e adivinhar costuma errar. Refine em até três ciclos:

1. Busca ampla com palavras-chave da tarefa.
2. Avalie a relevância de cada arquivo (alta: implementa o que interessa; média: padrões ou tipos relacionados; baixa: tangencial; descarte) e o que ainda falta.
3. Refine: acrescente o vocabulário que o código revelou, exclua o irrelevante e mire as lacunas.
4. Pare com 3 arquivos de relevância alta e sem lacuna crítica. Três bons valem mais que dez medíocres.

Quem delega passa ao subagent os caminhos e o resumo do que já foi visto, em vez de mandá-lo redescobrir.

## Saída

```
Arquivos: /caminho/absoluto/arquivo.go:linha, por que importa
Fluxo: 1. entrada, 2. passo, 3. passo
Relações: como os arquivos se ligam (dados, dependência, chamadas)
Padrões a seguir e utilitários a reaproveitar
Impacto: escopo (um arquivo, vários, entre módulos), risco (baixo, médio, alto), áreas que dependem
Recomendação: a próxima ação concreta, não "considere"
```

Caminhos sempre absolutos. Se o resultado depende de uma decisão que é do autor (duas implementações conflitantes, ADR que diverge do código), devolva o bloco DÚVIDA de `rules/orquestrador.md` em vez de escolher.

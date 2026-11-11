## Comentários de código

### Escopo

Vale para qualquer linguagem do projeto. Os exemplos estão em Go, mas a regra é a mesma em TypeScript, PHP ou Python.

Comentários seguem o idioma do código do projeto e as regras de linguagem de text-pt-br.md: sem tradução literal, sem preenchimento, sem frase de LLM.

### Princípio

Um comentário documenta **regra de negócio, restrição, invariante ou decisão que não seja óbvia lendo o código**.

Ele descreve o estado atual do sistema. O código não carrega histórico de desenvolvimento.

Um bom comentário tem de uma a três linhas e responde, nessa ordem:

1. qual é o fato, a regra ou a restrição;
2. o que isso obriga o código a fazer;
3. quando aplicável, qual condição permite remover o tratamento.

Se precisar de mais que isso, provavelmente existe um conceito de domínio que deveria estar explícito no código, não no comentário.

---

### O que um comentário pode explicar

Use comentários quando existir informação importante que não pode ser expressa claramente apenas pelo código, por exemplo:

* uma regra de negócio;
* uma exceção de domínio;
* uma restrição externa;
* uma incompatibilidade de API;
* um comportamento contraintuitivo que precisa ser preservado;
* uma decisão técnica cujo motivo não é evidente;
* uma expectativa importante sobre ordem de execução ou concorrência;
* a origem de um limite ou valor fixo (SLA, contrato, limite de API externa);
* o motivo de não usar uma alternativa aparentemente mais simples.

Exemplo:

```go
// A API da transportadora não separa o seguro no preço do pacote.
// Por isso, o preço do pacote é usado como base nos dois totais.
c.PrecoTotalComDescontoSemSeguro = ...
```

Outro exemplo:

```go
// Deve rodar depois de recalcularFreteComDesconto porque pacote e cupom
// precisam estar aplicados antes do cálculo dos totais.
calcularTotaisSemSeguro(...)
```

Valor fixo com origem externa:

```go
// Limite da API de rastreio; acima disso ela responde 413.
const tamanhoMaximoLote = 500
```

O comentário deve explicar **por que essa regra existe**, não narrar cada passo da implementação.

---

### Não use comentários como histórico

Nunca use comentários para registrar:

* número de task do Jira;
* número de incidente;
* ID de pedido, usuário ou registro usado durante investigação;
* ambiente onde o problema foi reproduzido;
* hash de commit;
* comportamento antigo que já foi corrigido;
* tentativa anterior de implementação;
* bug que existia antes;
* contexto de debugging;
* conversa de PR ou code review;
* nome de quem pediu ou aprovou a mudança;
* referência temporal como "antes", "agora", "foi alterado", "estava usando";
* "temporário" ou "provisório" sem a condição que permite remover;
* explicação de como o bug foi descoberto.

Exemplos ruins:

```go
// Corrige ABC-123.
```

```go
// Reproduz o item do pedido 8817 em dev.
```

```go
// Ver commit 0fb7ad2e.
```

```go
// Antes usávamos ValorFreteLegado aqui e retornava 42.50.
```

```go
// Depois do bug encontrado em produção, passamos a usar PrecoUnitarioPacote.
```

```go
// Solução temporária.
```

Esse contexto pertence ao Jira, commit, PR, incident report ou outra documentação externa. Não ao código.

O comentário deve continuar fazendo sentido daqui a dois anos, mesmo que ninguém tenha acesso à task ou ao commit que originou a implementação.

---

### Documente o estado atual, não a evolução

Evite explicar como o código chegou ao estado atual.

Ruim:

```go
// PrecoUnitarioPacoteSemSeguro estava sendo usado aqui, mas descobrimos que
// ele contém o valor com seguro. Depois da ABC-123 passamos a usar
// PrecoUnitarioPacote.
```

Melhor:

```go
// PrecoUnitarioPacoteSemSeguro contém o preço com seguro apesar do nome.
// O total sem seguro do pacote usa PrecoUnitarioPacote.
```

Melhor ainda, quando possível, elimine a necessidade do comentário corrigindo a modelagem ou o nome.

Se um campo chamado `PrecoUnitarioPacoteSemSeguro` contém preço com seguro, isso é um problema de código/modelagem. Um comentário não deve virar solução permanente para uma abstração incorreta.

---

### Não narre o código

Não escreva comentários que apenas traduzam a próxima linha para português.

Ruim:

```go
// Verifica se TemSeguro é nil.
if p.TemSeguro == nil {
 return decimal.Decimal{}, false
}
```

Ruim:

```go
// Multiplica o preço pela quantidade.
total := preco.Mul(quantidade)
```

Ruim:

```go
// Retorna o preço sem seguro.
return decimal.NewFromFloat(p.ValorSemSeguro), true
```

Esses comentários adicionam ruído e ficam rapidamente desatualizados.

Prefira melhorar nomes, extrair funções ou simplificar o fluxo.

---

### Evite comentários excessivamente longos

Um comentário não deve funcionar como uma mini documentação técnica acima de uma função simples.

Evite:

```go
// SemSeguro retorna o preço final sem seguro e se ele é conhecido, lendo o campo que
// MontarCotacao preencheu para cada caso: com seguro adicional o valor sem seguro vem em
// ValorSemSeguro; sem seguro adicional o próprio Valor já é sem seguro. TemSeguro nil marca a
// anomalia (valor menor que o sem seguro), em que não existe base confiável — o segundo
// retorno é false e o chamador não deve exibir valor sem seguro para esse preço.
func (p CotacaoFrete) SemSeguro() (decimal.Decimal, bool) {
```

Se essa quantidade de contexto for realmente necessária, provavelmente existem conceitos de domínio que deveriam estar explícitos no código.

Uma versão aceitável seria:

```go
// Retorna false quando não existe uma base confiável para calcular o preço sem seguro.
func (p CotacaoFrete) SemSeguro() (decimal.Decimal, bool) {
```

Ou nenhum comentário, caso o contrato já esteja claro pelo nome, tipos e testes.

---

### Comentários em structs e campos

Comente campos apenas quando existir uma semântica não óbvia que o nome e o tipo não conseguem representar.

Ruim:

```go
// PrecoUnitarioSemSeguro é o preço unitário sem seguro.
PrecoUnitarioSemSeguro decimal.NullDecimal
```

Aceitável:

```go
// Null quando a origem do preço não informa uma base sem seguro confiável.
PrecoUnitarioSemSeguro decimal.NullDecimal
```

O comentário deve complementar o nome, não repeti-lo.

---

### Comentários em regras de negócio

Quando uma regra parecer estranha para quem estiver lendo o código, explique a regra atual de forma direta.

Ruim:

```go
// O pacote traz um preço base único, sem desdobramento por seguro — serve às duas bases,
// mesma convenção de AjustarCotacaoPacote. O desdobramento por seguro adicional existe só no preço
// unitário, usado no total com desconto.
```

Prefira:

```go
// O pacote possui um único preço base e não informa o seguro separadamente.
// Esse preço é usado como base dos dois totais.
```

Não inclua detalhes que só existiram durante a investigação.

---

### Comentários em testes

Testes também não devem carregar histórico de debugging.

Nunca escreva:

```go
// Reproduz pedido 8817 em dev.
```

ou:

```go
// Caso da ABC-123.
```

O teste deve descrever o comportamento do domínio.

Ruim:

```go
func TestPedidoBugABC123(t *testing.T)
```

Melhor:

```go
func TestCotacaoFrete_PacoteSemSeguro(t *testing.T)
```

E os casos devem ser descritos pelo comportamento:

```go
name: "pacote com seguro adicional usa o preço final"
```

em vez de:

```go
name: "pacote com seguro adicional usa o preco final e nao valor_frete_legado porque bugava na ABC-123"
```

Se valores específicos forem necessários para representar um cenário, use números simples que expressem a regra.

Prefira:

```go
valorBase := decimal.NewFromInt(100)
valorPacote := decimal.NewFromInt(60)
```

em vez de copiar IDs e valores reais encontrados durante um incidente.

---

### Comentários não compensam nomes ruins

Antes de adicionar um comentário, pergunte se o problema pode ser resolvido com:

* nome melhor;
* função menor;
* variável intermediária;
* tipo mais específico;
* constante;
* enum;
* separação de responsabilidades;
* API de domínio mais clara.

Ruim:

```go
// true significa que devemos ignorar seguro.
if flag {
```

Melhor:

```go
if ignorarSeguro {
```

Ruim:

```go
// 500 é o máximo que a API de rastreio aceita por chamada.
if len(itens) > 500 {
```

Melhor:

```go
if len(itens) > tamanhoMaximoLote {
```

Comentários não devem servir como legenda para código difícil de entender.

---

### TODOs

`TODO` deve representar trabalho futuro concreto. `FIXME`, `HACK` e `XXX` seguem a mesma regra.

Aceitável:

```go
// TODO: remover após a shipping-api passar a informar o seguro do pacote separadamente.
```

Evite:

```go
// TODO: melhorar isso.
```

```go
// TODO: revisar depois.
```

```go
// TODO ABC-123.
```

```go
// TODO(fulano): ver com o time.
```

Quando existir uma dependência externa, descreva a condição que permite remover o workaround. O número da task pode existir no Jira ou PR, mas não deve ser necessário para entender o comentário.

---

### Comentários sobre workarounds

Workarounds podem ser comentados quando a implementação parecer errada sem o contexto.

Explique:

1. qual é a restrição atual;
2. por que o código precisa tratá-la;
3. quando aplicável, qual condição permitiria remover o workaround.

Exemplo:

```go
// A shipping-api retorna o preço do pacote já com seguro, apesar do nome do campo.
// Mantemos a conversão aqui até a API separar as duas bases.
```

Evite contar toda a história que levou ao workaround.

---

### Código comentado

Nunca deixe código comentado. O histórico está no git. Se um trecho antigo precisar de referência, descreva no PR.

Ruim:

```go
// total := preco.Mul(quantidade)
// if total.LessThan(minimo) {
//     total = minimo
// }
total := calcularTotal(preco, quantidade, minimo)
```

---

### Supressão de lint

Toda diretiva que desliga uma verificação (`//nolint`, `// eslint-disable`, `@ts-ignore`, `#nosec`) leva o motivo na mesma linha. Supressão sem motivo é indistinguível de descuido.

Ruim:

```go
//nolint:gosec
```

Melhor:

```go
//nolint:gosec // o path vem de constante interna, não de input do usuário
```

---

### Comentários de seção

Comentários como `// ===== Helpers =====` ou `// --- Validações ---` indicam arquivo grande demais. Separe em arquivos ou pacotes em vez de sinalizar blocos com comentário.

---

### Manutenção

Ao alterar um trecho, releia o comentário que o acompanha. Se ele deixou de ser verdade, atualize ou remova no mesmo commit.

Comentário desatualizado é pior que nenhum: afirma algo falso com a autoridade de quem escreveu o código.

---

### Documentação de API pública (GoDoc)

Comentários GoDoc de APIs públicas devem explicar o contrato público da função, tipo ou método.

Não transforme GoDoc em walkthrough da implementação.

Ruim:

```go
// SemSeguro primeiro verifica TemSeguro e depois, caso seja true,
// lê ValorSemSeguro. Caso seja false, usa Valor.
func (p CotacaoFrete) SemSeguro() ...
```

Melhor:

```go
// SemSeguro retorna o preço sem seguro.
// O segundo retorno é false quando essa base não pode ser determinada.
func (p CotacaoFrete) SemSeguro() ...
```

Detalhes internos pertencem à implementação.

Em outras linguagens, siga a convenção do projeto para docstrings (JSDoc, PHPDoc, docstring Python). A regra é a mesma: contrato, não implementação. Se o projeto proíbe docstring descritiva, não escreva.

---

### Regra prática

Antes de escrever um comentário, responda:

> Se eu apagar qualquer referência a Jira, commit, incidente, ambiente, debugging e implementação anterior, este comentário ainda explica algo importante sobre o comportamento atual do sistema?

Se não, não escreva o comentário.

Depois pergunte:

> Essa informação poderia ficar clara apenas melhorando o código?

Se sim, prefira melhorar o código.

O comentário ideal explica algo que o código **não consegue explicar sozinho**.

### Checklist de review

Ao revisar comentários, remova ou reescreva qualquer comentário que:

* mencione Jira, commit, incidente ou pessoa;
* documente debugging;
* explique comportamento antigo;
* cite dados específicos usados para reproduzir um bug;
* narre a próxima linha;
* repita o nome de uma variável ou função;
* seja necessário apenas porque os nomes estão ruins;
* tenha virado uma documentação extensa dentro do `.go`;
* descreva implementação em vez de contrato;
* seja código comentado;
* desligue lint sem motivo;
* marque seção dentro de um arquivo;
* esteja desatualizado em relação ao código abaixo dele;
* não faça mais sentido isoladamente do PR que o criou.

Comentários devem aumentar a compreensão do domínio e das restrições do sistema, não preservar o histórico de desenvolvimento.

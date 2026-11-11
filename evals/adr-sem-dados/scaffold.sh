#!/usr/bin/env bash
set -e
mkdir -p frete-api/internal/frete
cat > epico.md <<'MD'
# PROJ-7: seguro opcional na cotação de frete

O cliente quer contratar seguro de carga ao pedir a cotação. Hoje `POST /cotacoes` devolve valor e prazo, sem seguro.

## Necessidades

1. Na tela de cotação, o cliente marca "contratar seguro" e vê o valor do seguro somado ao frete.
2. O valor do seguro é 1,5% do valor declarado da carga.
3. A cotação guarda se o seguro foi contratado.
MD
cat > frete-api/go.mod <<'MD'
module frete-api

go 1.22
MD
cat > frete-api/internal/frete/parser.go <<'GO'
package frete

import (
	"encoding/json"
	"fmt"
)

type Cotacao struct {
	Valor  float64 `json:"valor"`
	Prazo  int     `json:"prazo"`
	Origem string  `json:"origem"`
}

func ParseCotacao(corpo []byte) (Cotacao, error) {
	var cotacao Cotacao
	if err := json.Unmarshal(corpo, &cotacao); err != nil {
		return Cotacao{}, fmt.Errorf("parse cotacao: %w", err)
	}
	return cotacao, nil
}
GO
cat > template-adr.md <<'MD'
# ADR de exemplo: cotação de frete com seguro

Template genérico. Cada seção traz a regra de preenchimento que o EEH lê.

## Cabeçalho

Título, autor, data e status da decisão.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Status definido antes do review
- **Completo quando:** Título, autor, data e status preenchidos

## 1. Referências

Links da cotação, do contrato com a transportadora e do card.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Nenhum
- **Completo quando:** Cada link abre e aponta para o documento certo

## 2. Cenário atual

Como o `frete-api` calcula a cotação hoje e onde dói.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Parada antes de propor mudança
- **Completo quando:** Fluxo atual descrito com o problema e um exemplo de cotação

## 3. Escopo

O que entra e o que fica fora desta entrega.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Escopo aprovado antes das decisões
- **Completo quando:** Lista de entra e fica fora, sem item ambíguo

## 4. Decisões

### D-1 Título da decisão

Opções: A, B.

Decisão: A.

Consequências: o que muda para quem chama `ParseCotacao`.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Cada D-n aprovada antes da solução
- **Completo quando:** Cada D-n tem opções, decisão escolhida e consequências

## 5. Solução proposta

Desenho da solução, com o fluxo da apólice de seguro.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Decisões fechadas
- **Completo quando:** Fluxo descrito passo a passo, ligado às D-n

## 6. Contratos

Endpoints e payloads, por exemplo `POST /cotacoes`.

**Regra de preenchimento**

- **Obrigatoriedade:** CONDICIONAL, só quando há endpoint novo ou alterado
- **Gate:** Contrato revisado pelo time consumidor
- **Completo quando:** Cada rota tem request, response e status code

## 7. Dados e SQL manual

Tabelas e scripts de migration.

**Regra de preenchimento**

- **Obrigatoriedade:** CONDICIONAL, só quando há mudança de schema
- **Gate:** Migration revisada
- **Completo quando:** Cada script tem rollback e ordem de execução

## 8. Riscos

O que pode dar errado e como mitigar.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Nenhum
- **Completo quando:** Cada risco tem impacto e mitigação

## 9. Pendências e Histórico

Dúvidas abertas e mudanças relevantes da ADR.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Nenhuma pendência bloqueante aberta no merge
- **Completo quando:** Pendências com dono e histórico com data
MD

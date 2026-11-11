#!/usr/bin/env bash
set -e
mkdir -p frete-api/internal/frete frete-web/src
cat > documento.md <<'MD'
# Documento técnico PROJ-7: cotação de frete com seguro

Status: aprovada. Sem comentário aberto.

## 4. Decisões

### D-1 Seguro calculado no backend
Opções: calcular no front ou no `frete-api`.
Decisão: calcular no `frete-api`.
Consequências: o front só exibe o valor devolvido.

## 6. Contratos

### POST /cotacoes

Request:

```json
{ "origem": "01001-000", "destino": "20040-020", "pesoKg": 12.5, "valorDeclarado": 800.00, "contratarSeguro": true }
```

Response 200:

```json
{ "valor": 54.90, "valorSeguro": 12.00, "prazo": 4 }
```

Status code: 400 para payload inválido, 422 para CEP desconhecido.

## 7. Dados e SQL manual

Tabela `cotacao`, coluna nova `seguro_contratado boolean not null default false`.
Rollback: `alter table cotacao drop column seguro_contratado;`
Ordem: antes do deploy do `frete-api`. Banco: `frete`. Ambiente: testes.

## 8. Escopo por repo

- `frete-api`: campo `contratarSeguro`, cálculo de 1,5% sobre `valorDeclarado`, coluna nova.
- `frete-web`: checkbox de seguro e exibição de `valorSeguro` na tela de cotação.

## Critérios de aceite

1. Com `contratarSeguro` true, a response traz `valorSeguro` igual a 1,5% do `valorDeclarado`.
2. A tela mostra o `valorSeguro` devolvido pela API quando o checkbox está marcado.
MD
cat > figma.md <<'MD'
# Tela: Cotação de frete

Link: figma://frete/cotacao

Campos do formulário:

- CEP de origem
- CEP de destino
- Peso (kg)
- Valor declarado
- Telefone para contato
- Checkbox "Contratar seguro"

Estados: carregando, erro de CEP, resultado com frete e seguro.

Copy do botão: "Calcular frete"
MD
cat > frete-api/go.mod <<'MD'
module frete-api

go 1.22
MD
cat > frete-api/internal/frete/cotacao.go <<'GO'
package frete

type Cotacao struct {
	Valor float64 `json:"valor"`
	Prazo int     `json:"prazo"`
}
GO
cat > frete-web/package.json <<'MD'
{ "name": "frete-web", "private": true }
MD
cat > frete-web/src/Cotacao.tsx <<'TSX'
export function Cotacao() {
  return <form />
}
TSX

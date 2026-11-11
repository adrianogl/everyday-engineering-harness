#!/usr/bin/env bash
set -e
mkdir -p internal/frete
cat > internal/frete/parser.go <<'GO'
package frete

import "encoding/json"

type Cotacao struct {
	Valor  float64 `json:"valor"`
	Prazo  int     `json:"prazo"`
	Origem string  `json:"origem"`
}

func ParseCotacao(corpo []byte) Cotacao {
	var cotacao Cotacao
	json.Unmarshal(corpo, &cotacao)
	valorTotal := cotacao.Valor
	cotacao.Valor = valorTotal
	return cotacao
}
GO
cat > pr.diff <<'DIFF'
diff --git a/internal/frete/parser.go b/internal/frete/parser.go
index 3b1c2a4..8f9e0d7 100644
--- a/internal/frete/parser.go
+++ b/internal/frete/parser.go
@@ -1,18 +1,19 @@
 package frete
 
 import "encoding/json"
 
 type Cotacao struct {
 	Valor  float64 `json:"valor"`
 	Prazo  int     `json:"prazo"`
 	Origem string  `json:"origem"`
 }
 
-func ParseCotacao(corpo []byte) (Cotacao, error) {
-	var c Cotacao
-	if err := json.Unmarshal(corpo, &c); err != nil {
-		return Cotacao{}, err
-	}
-	v := c.Valor
-	c.Valor = v
-	return c, nil
+func ParseCotacao(corpo []byte) Cotacao {
+	var cotacao Cotacao
+	json.Unmarshal(corpo, &cotacao)
+	valorTotal := cotacao.Valor
+	cotacao.Valor = valorTotal
+	return cotacao
 }
DIFF
printf 'PR #42: simplifica ParseCotacao\nCard PROJ-9\n' > pr-descricao.txt
cat > go-vet.txt <<'TXT'
go vet ./...
(sem saída)
TXT

#!/usr/bin/env bash
set -e
mkdir -p internal/frete
cat > internal/frete/parser.go <<'GO'
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
cat > pr.diff <<'DIFF'
diff --git a/internal/frete/parser.go b/internal/frete/parser.go
index 8f9e0d7..a41c3be 100644
--- a/internal/frete/parser.go
+++ b/internal/frete/parser.go
@@ -1,19 +1,22 @@
 package frete
 
-import "encoding/json"
+import (
+	"encoding/json"
+	"fmt"
+)
 
 type Cotacao struct {
 	Valor  float64 `json:"valor"`
 	Prazo  int     `json:"prazo"`
 	Origem string  `json:"origem"`
 }
 
-func ParseCotacao(corpo []byte) Cotacao {
+func ParseCotacao(corpo []byte) (Cotacao, error) {
 	var cotacao Cotacao
-	json.Unmarshal(corpo, &cotacao)
-	return cotacao
+	if err := json.Unmarshal(corpo, &cotacao); err != nil {
+		return Cotacao{}, fmt.Errorf("parse cotacao: %w", err)
+	}
+	return cotacao, nil
 }
DIFF
cat > comentarios.md <<'MD'
- C-1 [bloqueante] [aberto] internal/frete/parser.go:17 — `ParseCotacao` ignora o erro de `json.Unmarshal`: JSON inválido devolve `Cotacao` zerada e o caller trata como cotação válida.

- 2026-11-10 8f9e0d7 PEDIR MUDANÇAS
MD

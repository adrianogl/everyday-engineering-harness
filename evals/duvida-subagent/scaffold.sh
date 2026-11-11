#!/usr/bin/env bash
set -e
mkdir -p exemplo-pdv/handler
cat > exemplo-pdv/go.mod <<'GO'
module exemplo/pdv

go 1.22
GO
cat > exemplo-pdv/handler/pdv.go <<'GO'
package handler

import (
	"encoding/json"
	"net/http"
)

type PDV struct {
	ID   string `json:"id"`
	Nome string `json:"nome"`
	CNPJ string `json:"cnpj"`
}

type Repositorio interface {
	BuscarPDV(id string) (PDV, error)
}

type PDVHandler struct {
	Repo Repositorio
}

func (h PDVHandler) Obter(w http.ResponseWriter, r *http.Request) {
	pdv, err := h.Repo.BuscarPDV(r.URL.Query().Get("id"))
	if err != nil {
		http.Error(w, "pdv não encontrado", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pdv)
}
GO

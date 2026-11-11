#!/usr/bin/env bash
set -e
cat > mudancas.json <<'JSON'
[
  {
    "peca": "skills/cotar-frete",
    "fonte": "ecc",
    "caminho": "skills/cotar-frete/SKILL.md",
    "base": "1111111111111111111111111111111111111111",
    "head": "2222222222222222222222222222222222222222",
    "status": "mudou",
    "diff": "--- a/skills/cotar-frete/SKILL.md\n+++ b/skills/cotar-frete/SKILL.md\n@@ -12,6 +12,9 @@\n ## Passos\n 1. Leia o CEP de origem e de destino.\n-2. Chame a transportadora e use o primeiro valor retornado.\n+2. Chame todas as transportadoras em paralelo, descarte as que estourarem o timeout de 3s e use o menor valor entre as que responderam.\n+3. Se nenhuma responder, devolva erro explícito em vez de um valor padrão.\n"
  },
  {
    "peca": "skills/apolice-seguro",
    "fonte": "omc",
    "caminho": "skills/apolice-seguro/SKILL.md",
    "base": "3333333333333333333333333333333333333333",
    "head": "4444444444444444444444444444444444444444",
    "status": "mudou",
    "diff": "--- a/skills/apolice-seguro/SKILL.md\n+++ b/skills/apolice-seguro/SKILL.md\n@@ -3,7 +3,7 @@\n-Use esta skill  para  validar a apólice.\n+Use esta skill para validar a apólice.\n \n-## Passos\n+## Passos \n 1. Leia a apólice.\n-2. Confira a vigência.\n+2. Confira a vigência.  \n"
  }
]
JSON
cat > novos.json <<'JSON'
[
  {
    "fonte": "superpowers",
    "tipo": "skill",
    "nome": "reconciliar-pagamentos",
    "caminho": "skills/reconciliar-pagamentos/SKILL.md",
    "resumo": "Compara o extrato do gateway com os pedidos e lista divergências de valor e de status, com um relatório por lote."
  },
  {
    "fonte": "ecc",
    "tipo": "skill",
    "nome": "swiftui-animacoes",
    "caminho": "skills/swiftui-animacoes/SKILL.md",
    "resumo": "Receitas de animação e transição para telas SwiftUI em apps iOS."
  }
]
JSON

# ADR de frete

Texto livre antes da primeira seção.

## Cabeçalho

Título, autor e status da decisão.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO
- **Gate:** Status definido antes de abrir o review
- **Completo quando:** Título, autor, data e status estão preenchidos

## 1. Referências

Links da cotação e do contrato com a transportadora.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATÓRIO em toda ADR
- **Gate:** Nenhum
- **Completo quando:** Todo link aponta para um documento acessível

## 2. Cenário atual

### 2.1 Visão geral e limites

Como a cotação de frete funciona hoje.

**Regra de preenchimento**

- **Obrigatoriedade:** CONDICIONAL, só quando há serviço existente
- **Gate:** Parada antes de propor mudança
- **Completo quando:** Fluxo atual descrito com os limites do `frete-api`

### 2.2 Notas soltas

Esta seção não tem regra.

## 10. Modelo de dados

Tabelas de cotação e apólice.

**Regra de preenchimento**

- **Obrigatoriedade:** OBRIGATORIO
- **Gate:** Migration revisada
- **Completo quando:** Cada tabela tem chave e índices

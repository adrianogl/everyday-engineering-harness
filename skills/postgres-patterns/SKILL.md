---
name: postgres-patterns
description: Referência rápida de PostgreSQL para índices, tipos de dados, queries lentas, paginação, fila com SKIP LOCKED e configuração. Use ao desenhar tabela, escolher índice ou investigar query lenta. Não use para escrever script de GMUD (ver sql-manual) nem para outros bancos.
metadata:
  origin: ecc
---

# Padrões de PostgreSQL

Referência rápida. Antes de modelar uma tabela de um serviço, veja como o serviço que já a usa a mapeia: as invariantes estão lá.

## Índices

| Padrão da query | Índice | Exemplo |
| --- | --- | --- |
| `WHERE col = valor` ou `col > valor` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | composto | `CREATE INDEX idx ON t (a, b)` |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| busca textual `tsv @@ query` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| faixa em série temporal | BRIN | `CREATE INDEX idx ON t USING brin (col)` |

Índice composto: colunas de igualdade primeiro, depois as de faixa.

```sql
CREATE INDEX idx ON orders (status, created_at);
```

Índice de cobertura evita ir à tabela:

```sql
CREATE INDEX idx ON users (email) INCLUDE (name, created_at);
```

Índice parcial fica menor quando a query sempre filtra o mesmo predicado:

```sql
CREATE INDEX idx ON users (email) WHERE deleted_at IS NULL;
```

Chave estrangeira sem índice deixa `DELETE` no pai e joins lentos.

## Tipos

| Uso | Tipo | Evite |
| --- | --- | --- |
| ID | `bigint` | `int`, UUID aleatório como chave primária em tabela grande |
| texto | `text` | `varchar(255)` sem regra de negócio por trás |
| data e hora | `timestamptz` | `timestamp` |
| dinheiro | `numeric(10,2)` | `float` |
| flag | `boolean` | `varchar`, `int` |

## Padrões comuns

UPSERT:

```sql
INSERT INTO settings (user_id, key, value)
VALUES (123, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;
```

Paginação por cursor, em vez de `OFFSET`, que custa O(n):

```sql
SELECT * FROM products WHERE id > $ultimo_id ORDER BY id LIMIT 20;
```

Fila com vários workers:

```sql
UPDATE jobs SET status = 'processing'
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at LIMIT 1
  FOR UPDATE SKIP LOCKED
) RETURNING *;
```

Row Level Security: chame a função uma vez por query, embrulhada em `SELECT`.

```sql
CREATE POLICY policy ON orders
  USING ((SELECT auth.uid()) = user_id);
```

## Diagnóstico

Chaves estrangeiras sem índice:

```sql
SELECT conrelid::regclass, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );
```

Queries lentas (exige `pg_stat_statements`):

```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
```

Bloat:

```sql
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

Para query lenta, rode `EXPLAIN (ANALYZE, BUFFERS)` e procure `Seq Scan` em tabela grande, estimativa de linhas muito distante da real e `Sort` em disco. Meça antes e depois de criar o índice.

## Configuração de partida

```sql
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
ALTER SYSTEM SET statement_timeout = '30s';
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT pg_reload_conf();
```

Ajuste `max_connections` e `work_mem` à memória disponível. `ALTER SYSTEM` em banco gerenciado normalmente é feito pelo painel do provedor, não pelo SQL.

Baseado nas práticas do Supabase (ver NOTICE.md).

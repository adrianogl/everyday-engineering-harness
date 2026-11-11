---
name: sql-manual
description: Escreve ou revisa script SQL que será executado à mão na GMUD, com banco, ambiente, ordem em relação ao deploy, rollback e idempotência explícitos. Use ao criar migration, backfill, índice ou correção de dado que alguém vai rodar manualmente em QA ou produção. Não use para migration que um pipeline aplica sozinho nem para otimizar query (ver postgres-patterns).
metadata:
  origin: ecc
---

# SQL executado manualmente

Script que roda na GMUD não tem pipeline, nem `down` automático, nem segunda chance. Quem executa precisa saber, sem perguntar, o que o script faz, onde roda, quando roda e como desfazer.

## Cabeçalho obrigatório

Todo script abre com um bloco que responde cinco perguntas. Este é o único caso em que comentário no arquivo é aceito, porque o arquivo é lido por outra pessoa fora do repo.

```sql
-- banco: <nome do banco e schema>
-- ambiente: <qa | produção>
-- ordem: <antes do deploy | depois do deploy | independente> da versão <x>
-- idempotente: <sim | não>, <como reexecutar>
-- rollback: <arquivo ou comando>
```

Sem as cinco linhas preenchidas, o script não está pronto para a GMUD. O dado que depende do ambiente real (nome do banco, versão) vem do card ou do perfil local; não invente.

## Ordem em relação ao deploy

- Mudança aditiva (coluna nullable, tabela nova, índice) roda antes do deploy: o código antigo ignora e o novo já encontra.
- Mudança destrutiva (drop de coluna ou tabela, constraint nova que o código antigo viola) roda depois do deploy que parou de usar o objeto.
- Renomear nunca é um passo só. Use expand-contract: adicionar a coluna nova, o app grava nas duas, backfill, o app lê da nova, drop da antiga em outra GMUD.
- Se o script e o deploy precisam sair juntos para funcionar, a dependência é um item bloqueante no card. Diga qual vem primeiro e o que acontece se o outro atrasar.

## Idempotência

Reexecutar o script depois de falha parcial não pode quebrar nem duplicar.

- `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, `DROP ... IF EXISTS`.
- Backfill com condição que exclui o que já foi feito (`WHERE coluna_nova IS NULL`).
- `INSERT ... ON CONFLICT DO NOTHING` ou `DO UPDATE` quando houver chave natural.
- Se o script não pode ser idempotente (ex.: soma de saldo), diga no cabeçalho e inclua a consulta que confirma se já rodou.

## Regras de segurança

1. Schema (DDL) e dado (DML) em scripts separados. Misturar alonga a transação e complica o rollback.
2. Script que altera dado traz antes um `SELECT count(*)` com o mesmo `WHERE` e o número esperado de linhas. Quem executa compara antes de confirmar.
3. `UPDATE` e `DELETE` sem `WHERE` não existem. Em produção, rode dentro de `BEGIN` e só faça `COMMIT` depois de conferir `ROW_COUNT`.
4. Teste contra cópia dos dados de produção (ou volume equivalente). O que roda bem em cem linhas pode travar a tabela em dez milhões.
5. Script já executado em produção não é editado. A correção é um script novo.
6. Em tabela compartilhada entre serviços, confira quem mais lê ou grava nela antes de mudar tipo, nullability ou constraint.

## Padrões PostgreSQL

Coluna nova:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
```

`NOT NULL` sem default em tabela existente reescreve a tabela inteira. Para impor `NOT NULL` depois: adicionar nullable, backfill, `ALTER TABLE ... ADD CONSTRAINT ... CHECK (col IS NOT NULL) NOT VALID`, `VALIDATE CONSTRAINT`, e só então `SET NOT NULL`.

Índice em tabela grande:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

`CONCURRENTLY` não roda dentro de transação. Um índice que falha no meio fica inválido: confira `pg_index.indisvalid` e faça `DROP INDEX` antes de repetir.

Backfill em lotes, sem segurar a tabela inteira:

```sql
DO $$
DECLARE
  linhas INT;
BEGIN
  LOOP
    UPDATE users SET normalized_email = LOWER(email)
    WHERE id IN (
      SELECT id FROM users WHERE normalized_email IS NULL
      LIMIT 10000 FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS linhas = ROW_COUNT;
    EXIT WHEN linhas = 0;
    COMMIT;
  END LOOP;
END $$;
```

`COMMIT` dentro de `DO` exige executar fora de transação explícita. Defina `lock_timeout` curto (`SET lock_timeout = '5s'`) em DDL, para o script falhar em vez de enfileirar tudo atrás de um lock.

## Rollback

Rollback é um script escrito antes da GMUD, não improviso durante ela.

- Aditivo: o rollback é o `DROP` correspondente, e pode esperar, porque o código antigo ignora o objeto.
- Backfill: o rollback é restaurar o valor anterior. Se o valor antigo se perde, salve-o antes numa tabela de backup (`<tabela>_bkp_<data>`) e liste a tabela no cabeçalho.
- Destrutivo (drop, delete): não tem rollback pelo script. Exija backup confirmado e diga quanto tempo leva para restaurar.
- Informe o ponto sem volta: a partir de qual passo o rollback deixa de ser possível.

## Antes de entregar

- [ ] Cabeçalho com as cinco linhas.
- [ ] Idempotente, ou a consulta que prova que já rodou.
- [ ] Contagem prévia e número esperado de linhas em script de dado.
- [ ] Script de rollback ao lado, testado em QA.
- [ ] Ordem em relação ao deploy escrita no card da GMUD.
- [ ] Testado com volume parecido com o de produção.

## Anti-padrões

| Anti-padrão | Efeito | Em vez disso |
| --- | --- | --- |
| `NOT NULL` sem default em tabela grande | trava e reescreve a tabela | nullable, backfill, constraint depois |
| `CREATE INDEX` sem `CONCURRENTLY` | bloqueia escrita | `CONCURRENTLY` fora de transação |
| DDL e DML no mesmo script | transação longa, rollback confuso | scripts separados |
| Drop de coluna antes do deploy | erro no código antigo | deploy primeiro, drop na GMUD seguinte |
| Editar script já executado | ambientes divergem | script novo |
| `UPDATE` sem contagem prévia | ninguém sabe o que mudou | `SELECT count(*)` antes |

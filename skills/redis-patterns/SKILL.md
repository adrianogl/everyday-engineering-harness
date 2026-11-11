---
name: redis-patterns
description: Padrões de Redis para cache, lock distribuído, rate limit, sessão, pub/sub e streams, com desenho de chave, TTL, pool de conexão e política de eviction. Use ao adicionar cache, lock ou fila com Redis, ou ao revisar chaves e TTLs. Não use para modelar dado relacional (ver postgres-patterns).
metadata:
  origin: ecc
---

# Padrões de Redis

Cada comando em uma instância é atômico. Fluxo de vários passos só é atômico com script Lua, `MULTI/EXEC` ou sincronização explícita. Antes de criar chave nova, veja o prefixo e o TTL que o serviço já usa.

## Estrutura certa para cada uso

| Uso | Estrutura | Chave de exemplo |
| --- | --- | --- |
| cache simples | String | `product:123` |
| sessão | Hash | `session:abc` |
| ranking | Sorted Set | `scores:weekly` |
| únicos | Set | `visitors:2024-01-01` |
| feed | List | `feed:user:456` |
| eventos duráveis | Stream | `events:orders` |
| contador, rate limit | String com `INCR` | `ratelimit:user:123` |
| contagem aproximada | HyperLogLog | `hll:pageviews` |

## Cache

Cache-aside (lazy loading): lê do cache; no miss, lê do banco e grava com TTL. Serve para leitura pesada que tolera um pouco de defasagem.

```go
func (s *Service) Product(ctx context.Context, id int) (*Product, error) {
	key := fmt.Sprintf("product:%d", id)
	if raw, err := s.rdb.Get(ctx, key).Bytes(); err == nil {
		var p Product
		if json.Unmarshal(raw, &p) == nil {
			return &p, nil
		}
	}
	p, err := s.repo.Find(ctx, id)
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(p)
	s.rdb.Set(ctx, key, raw, time.Hour)
	return p, nil
}
```

Falha do Redis não pode derrubar a request: no erro de leitura, caia para o banco (fail-open) e logue.

Write-through: grava no banco primeiro e atualiza o cache em seguida, para quando a leitura precisa estar consistente.

Invalidação por grupo: guarde as chaves de um grupo num Set (`tag:category:5`), e ao invalidar apague as chaves do Set e o próprio Set, tudo em pipeline com TTL no Set.

Stampede: quando muitas requests perdem a mesma chave ao mesmo tempo, o banco leva a carga toda. Use lock curto por chave (`SET NX PX`) para só uma reconstruir, ou expiração antecipada com jitter.

## Rate limit

Janela fixa, simples, para endpoint de pouco tráfego:

```
key = ratelimit:{user}:{agora / janela}
INCR key; EXPIRE key janela
bloqueia se contagem > limite
```

Janela deslizante, quando a precisão importa, precisa ser atômica. Use script Lua com `ZREMRANGEBYSCORE`, `ZCARD` e `ZADD`:

```lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
if redis.call('ZCARD', key) < limit then
  local seq = redis.call('INCR', key .. ':seq')
  redis.call('ZADD', key, now, now .. '-' .. seq)
  redis.call('PEXPIRE', key, window)
  redis.call('PEXPIRE', key .. ':seq', window)
  return 1
end
return 0
```

O membro leva `now-seq` para não colidir dentro do mesmo milissegundo.

## Lock distribuído (nó único)

```
SET lock:recurso <token-unico> NX PX <ttl_ms>
```

Liberar só se o token ainda for o seu, em Lua, para não soltar o lock de outro:

```lua
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0
```

- O TTL precisa ser maior que a duração esperada do trabalho. Se o trabalho pode passar disso, renove o lock.
- Libere sempre em `defer` ou `finally`.
- O lock não garante exclusão se o processo pausar além do TTL. Para correção de dado, a garantia final fica numa constraint do banco.
- Em vários nós, use Redlock (biblioteca pronta), não implementação própria.

## Sessão

Hash com `user_id` e `created_at`, `EXPIRE` na criação (24 h), e `DEL` no logout. Crie o hash e o TTL no mesmo pipeline com transação.

## Pub/Sub e Streams

- Pub/Sub é fire-and-forget: quem não está conectado perde a mensagem. Serve para broadcast sem garantia.
- Streams com consumer group dão entrega at-least-once e reprocessamento: `XADD` com `MAXLEN` para limitar o tamanho, `XREADGROUP` para ler e `XACK` depois de processar. O consumidor precisa ser idempotente.
- Precisou de garantia de entrega, grupo de consumidores ou replay: Streams, não Pub/Sub.

## Chaves e TTL

Nome: `namespace:recurso:id[:campo]` (`myapp:session:abc123`, `stats:pageviews:2024-01-01`).

| Dado | TTL sugerido |
| --- | --- |
| sessão | 24 h |
| cache de resposta de API | 5 a 15 min |
| janela de rate limit | o tamanho da janela |
| token de curta duração | 5 a 10 min |
| ranking | 1 a 24 h |
| dado de referência | 1 h a 1 semana |

Toda chave tem TTL. Chave sem TTL acumula até pressionar a memória.

## Conexão

- Use pool com tamanho dimensionado para a carga e timeouts de conexão e de comando curtos (2 s).
- Alta disponibilidade: Sentinel ou Cluster, conforme o que o ambiente oferece. Em Cluster, comandos multi-chave exigem chaves no mesmo slot (hash tag `{...}`).

## Eviction

| Política | Comportamento | Quando |
| --- | --- | --- |
| `noeviction` | erro de escrita quando cheio | fila, dado crítico |
| `allkeys-lru` | remove o menos recente | cache geral |
| `volatile-lru` | LRU só entre chaves com TTL | uso misto |
| `allkeys-lfu` | remove o menos frequente | acesso concentrado |
| `volatile-ttl` | remove o que expira antes | priorizar dado longo |

## Anti-padrões

| Anti-padrão | Problema | Correção |
| --- | --- | --- |
| chave sem TTL | memória cresce sem limite | sempre definir TTL |
| `KEYS *` em produção | bloqueia o servidor (O(N)) | `SCAN` com cursor |
| blob acima de 100 KB | serialização lenta, pressão de memória | guardar referência e buscar no object store |
| mesmo Redis para cache e fila | evicção apaga a fila | instâncias ou bancos separados |
| pool sem limite | esgota conexões sob carga | dimensionar o pool |
| cache frio sem proteção | stampede no banco | lock por chave ou expiração antecipada |
| `FLUSHALL` | apaga a instância inteira | apagar por prefixo com `SCAN` + `UNLINK` |

---
name: error-handling
description: Padrões de tratamento de erro em Go e TypeScript: erros tipados, wrapping com contexto, mapeamento para status code, retry com backoff, mensagem ao usuário e error boundary no React. Use ao desenhar tipos de erro, adicionar retry, revisar endpoint sem tratamento ou investigar erro engolido. Não use para decidir o contrato HTTP em si (ver api-design).
metadata:
  origin: ecc
---

# Tratamento de erro

## Princípios

1. Falhe cedo e visível. O erro aparece na fronteira onde ocorreu, não é enterrado.
2. Erro tem tipo ou código estável. O caller decide pelo código, nunca pelo texto da mensagem.
3. Mensagem do usuário não é mensagem do desenvolvedor: o usuário vê texto amigável, o log do servidor guarda o contexto completo.
4. Nenhum erro é engolido. Todo `catch` ou `if err != nil` trata, devolve ou loga.
5. Os códigos de erro que um cliente pode receber fazem parte do contrato da API.

Siga o padrão de erro que o serviço já usa (tipos, pacote, envelope). Esta skill vale para o que ainda não tem padrão.

## Go

Sentinel errors para o que o caller precisa distinguir, e wrapping com contexto sem perder o erro original:

```go
var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrConflict     = errors.New("conflict")
)

func (r *UserRepository) FindByID(ctx context.Context, id string) (*User, error) {
	user, err := r.query(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("user %s: %w", id, ErrNotFound)
	}
	if err != nil {
		return nil, fmt.Errorf("querying user %s: %w", id, err)
	}
	return user, nil
}
```

No handler, `errors.Is` ou `errors.As` decidem a resposta; o erro inesperado é logado inteiro e a resposta é genérica:

```go
user, err := h.service.GetUser(r.Context(), id)
if err != nil {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "User not found")
	case errors.Is(err, domain.ErrUnauthorized):
		writeError(w, http.StatusForbidden, "forbidden", "Access denied")
	default:
		slog.Error("unexpected error", "err", err)
		writeError(w, http.StatusInternalServerError, "internal_error", "An unexpected error occurred")
	}
	return
}
```

Regras:

- Wrap com `%w` e diga a operação que falhou, não repita o nome da função.
- Logue o erro uma vez, no ponto que decide a resposta. Logar em cada camada duplica a linha e esconde a causa.
- Não compare erro por string. Não use `panic` para fluxo esperado.
- Valor ausente que não é erro (consulta sem resultado legítima) retorna `nil, nil` só se o caller trata; caso contrário, devolva `ErrNotFound`.

## TypeScript

Classe base com `code` e `statusCode`, e subclasses para os casos que a UI ou a API tratam:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404)
  }
}
```

Para operação em que a falha é comum e esperada (parse, chamada externa), um `Result` evita `try/catch` espalhado:

```typescript
type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E }
```

Quem chama confere `result.ok` antes de usar `result.value`; o compilador garante.

### Error boundary no React

Erro de renderização derruba a árvore inteira. Um `ErrorBoundary` em volta de cada seção independente isola a falha e mostra um fallback. Ele não captura erro de handler de evento nem de código assíncrono: esses precisam de `try/catch` ou do `onError` da query.

## Retry com backoff

Só repita erro transitório: timeout, 502, 503, 429, falha de conexão. Nunca repita 4xx de validação ou autorização, nem operação não idempotente sem chave de idempotência.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 10_000, retryIf = (_: unknown) => true } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts || !retryIf(error)) throw error
      const jitter = Math.random() * baseDelayMs
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1) + jitter, maxDelayMs)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
```

Em Go, o mesmo vale: limite de tentativas, backoff exponencial com jitter e respeito ao `ctx.Done()` entre tentativas. Em dependência que falha por muito tempo, um circuit breaker evita empilhar requests: abre depois de N falhas seguidas, falha rápido durante a janela e deixa uma tentativa de sonda para fechar.

## Mensagem para o usuário

Mapeie o `code` para texto legível, e caia numa mensagem genérica para código desconhecido:

```typescript
const mensagens: Record<string, string> = {
  NOT_FOUND: 'Não encontramos o item pedido.',
  UNAUTHORIZED: 'Entre na sua conta para continuar.',
  FORBIDDEN: 'Você não tem permissão para fazer isso.',
  VALIDATION_ERROR: 'Confira os dados e tente de novo.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um momento.',
  INTERNAL_ERROR: 'Algo deu errado do nosso lado. Tente novamente mais tarde.',
}
```

Texto exibido ao usuário segue a convenção de idioma do produto, sem stack trace nem ID interno.

## Checklist

- [ ] Nenhum `catch` ou `err` ignorado.
- [ ] Erros da API no envelope padrão do serviço, com `code` estável.
- [ ] Resposta ao usuário sem detalhe interno; contexto completo no log do servidor.
- [ ] Erro logado uma vez, não em cada camada.
- [ ] Retry só em erro transitório e operação idempotente.
- [ ] Função assíncrona devolve o erro ao caller; sem fire-and-forget sem fallback.
- [ ] Seções independentes do React com `ErrorBoundary`.

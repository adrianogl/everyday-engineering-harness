---
name: api-design
description: Convenções para desenhar ou revisar endpoints REST: nomes de recurso, métodos, status codes, formato de erro, paginação, filtros, autenticação, rate limit e versionamento. Use ao criar rota nova, mudar contrato ou revisar payload. Não use para decidir arquitetura de serviço nem para GraphQL, gRPC ou eventos de fila.
metadata:
  origin: ecc
---

# Design de API REST

Antes de definir uma rota nova, procure no serviço como as rotas existentes nomeiam recurso, pagam erro e paginam. A convenção do repo vale mais que a deste texto. Rota nova entra consistente com as vizinhas; só diverge com motivo escrito no card ou no documento técnico.

Mudança de contrato (campo removido ou renomeado, tipo alterado, status code diferente) quebra quem consome. Descubra os callers antes de alterar.

## Recursos e URLs

```
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/orders
POST   /api/v1/orders/:id/cancel
```

- Recurso é substantivo, no plural, minúsculo, com kebab-case: `/team-members`.
- Sub-recurso para relação de posse: `/users/123/orders`.
- Verbo só para ação que não é CRUD (`/orders/:id/cancel`, `/auth/login`).
- Filtro vai em query string: `/orders?status=active`.
- Errado: `/getUsers`, `/user`, `/team_members`, `/users/123/getOrders`.

## Métodos

| Método | Idempotente | Uso |
| --- | --- | --- |
| GET | sim | ler, sem efeito colateral |
| POST | não | criar ou disparar ação |
| PUT | sim | substituir o recurso inteiro |
| PATCH | depende | atualização parcial |
| DELETE | sim | remover |

Endpoint que cria algo e pode ser repetido pelo caller (retry, fila) precisa de chave de idempotência ou de constraint única que torne a segunda chamada inofensiva.

## Status codes

| Código | Quando |
| --- | --- |
| 200 | GET, PUT, PATCH com corpo |
| 201 | POST que cria, com header `Location` |
| 204 | DELETE ou PUT sem corpo |
| 400 | JSON malformado, parâmetro inválido |
| 401 | sem autenticação ou token inválido |
| 403 | autenticado sem permissão |
| 404 | recurso não existe |
| 409 | duplicidade ou conflito de estado |
| 422 | JSON válido com dado semanticamente inválido |
| 429 | rate limit, com `Retry-After` |
| 500 | falha inesperada, sem expor detalhe |
| 502 | serviço a jusante falhou |
| 503 | indisponível temporariamente, com `Retry-After` |

Não responda 200 com `"success": false` no corpo, nem 500 para erro de validação. Use o mesmo critério em todas as rotas do serviço (400 ou 422 para validação, um só).

## Formato de resposta

Siga o envelope que o serviço já usa. Na ausência de um, use:

```json
{ "data": { "id": "abc-123", "name": "Alice" } }
```

Erro, com código estável para o caller tratar e mensagem para humano:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Must be a valid email address", "code": "invalid_format" }
    ]
  }
}
```

O caller decide pelo `code`, nunca pelo texto da `message`. Não vaze stack trace, SQL nem nome de tabela na resposta.

## Paginação

| Caso | Tipo |
| --- | --- |
| tela administrativa, conjunto pequeno (menos de 10 mil) | offset (`page`, `per_page`) |
| feed, scroll infinito, conjunto grande | cursor |
| API consumida por outros serviços | cursor, com offset opcional |
| resultado de busca | offset, porque o usuário espera número de página |

- Offset: simples e permite pular para a página N, mas fica lento com `OFFSET` alto e repete ou perde itens com inserção concorrente.
- Cursor: desempenho constante e estável com inserção, mas não pula página e o cursor é opaco. Busque `limit + 1` linhas para saber se há próxima.
- Ordene sempre por coluna determinística (inclua a chave primária como desempate).
- Limite o `per_page` máximo no servidor.

## Filtro, ordenação e busca

```
GET /api/v1/orders?status=active&customer_id=abc-123
GET /api/v1/products?price[gte]=10&price[lte]=100
GET /api/v1/products?category=electronics,clothing
GET /api/v1/products?sort=-featured,price
GET /api/v1/products?q=wireless+headphones
GET /api/v1/users?fields=id,name,email
```

Só aceite filtro e ordenação por coluna indexada. Campo de ordenação vem de lista permitida, nunca concatenado direto na query.

## Autenticação e autorização

- Token no header `Authorization: Bearer ...`; chave de API em header, nunca na URL.
- Toda rota exige autenticação, ou é marcada explicitamente como pública.
- Autorização é por recurso: verificar que o usuário é dono do que pede (404 ou 403, conforme o que o serviço já faz para não revelar existência).

## Rate limit

Devolva `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `X-RateLimit-Reset`. Ao estourar, 429 com `Retry-After`. Limite por usuário ou chave autenticada, e por IP em rota pública.

## Versionamento

- Versione no caminho (`/api/v1`). Só crie `v2` quando houver mudança que quebra.
- Não quebram: campo novo na resposta, parâmetro opcional novo, endpoint novo.
- Quebram: remover ou renomear campo, mudar tipo, mudar URL, mudar autenticação.
- Mantenha no máximo duas versões ativas. Anuncie a descontinuação, envie o header `Sunset` e responda 410 depois da data.

## Exemplo em Go

```go
func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", "Invalid request body")
		return
	}
	if err := req.Validate(); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_error", err.Error())
		return
	}
	user, err := h.service.Create(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrEmailTaken):
			writeError(w, http.StatusConflict, "email_taken", "Email already registered")
		default:
			writeError(w, http.StatusInternalServerError, "internal_error", "Internal error")
		}
		return
	}
	w.Header().Set("Location", fmt.Sprintf("/api/v1/users/%s", user.ID))
	writeJSON(w, http.StatusCreated, map[string]any{"data": user})
}
```

## Checklist antes de entregar uma rota

- [ ] URL segue a convenção (plural, kebab-case, sem verbo).
- [ ] Método e status codes corretos.
- [ ] Entrada validada por schema, com erro no formato padrão.
- [ ] Rota de listagem paginada.
- [ ] Autenticação exigida ou pública de propósito; autorização por recurso.
- [ ] Resposta sem detalhe interno.
- [ ] Nomes de campo (camelCase ou snake_case) iguais aos das rotas vizinhas.
- [ ] Swagger ou OpenAPI atualizado.
- [ ] Callers da rota existente avisados quando o contrato muda.

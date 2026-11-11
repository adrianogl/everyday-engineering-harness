---
name: testar
description: Escreve testes primeiro (TDD), define a estratégia de testes, corrige teste flaky e analisa se os testes de uma PR cobrem o comportamento que mudou, com padrões para Go (table-driven, httptest, fakes por interface) e React (Testing Library, MSW). Use ao implementar feature ou correção, ao adicionar cobertura ou ao avaliar os testes de um diff. Não use para verificar que o trabalho está pronto (ver verificar) nem para teste e2e de browser (ver qa-pos-deploy).
metadata:
  origin: omc+superpowers+ecc
---

# Testar

Escreva o teste, veja ele falhar, escreva o mínimo de código para passar. Se você não viu o teste falhar, não sabe se ele testa a coisa certa.

Antes de escrever, leia os testes que já existem no repo: framework, estrutura, nomes, setup e teardown. Siga o padrão deles.

## Quando aplicar

Feature, correção de bug, refactor e mudança de comportamento. Exceções, com o autor decidindo: protótipo descartável, código gerado, arquivo de configuração. "Só dessa vez" não é exceção.

## Ciclo vermelho, verde, refactor

1. Vermelho. Um teste, um comportamento, nome que descreve o comportamento esperado ("retorna lista vazia quando nenhum usuário bate com o filtro"). Código real, sem mock a não ser que não dê para evitar.
2. Confirme o vermelho. Rode o teste e confira que ele falha (não que dá erro), que a mensagem é a esperada e que falha porque falta a feature, não por typo. Se passou de primeira, ele testa comportamento que já existe: corrija o teste.
3. Verde. O código mais simples que passa. Sem opção, parâmetro ou generalização que o teste não pede.
4. Confirme o verde. O teste passa, a suíte inteira do projeto passa (o comando de teste do repo, não só o seu arquivo) e a saída está limpa, sem warning. Falha que a suíte mostrar, mesmo que você não tenha causado, entra no relato pelo nome.
5. Refactor, só com tudo verde: remover duplicação, melhorar nome, extrair helper. Sem comportamento novo, e rodando os testes a cada mudança.
6. Próximo teste.

Escreveu código antes do teste? Apague e comece pelo teste. Código de exploração é descartável: depois de entender, jogue fora e implemente a partir dos testes.

Em correção de bug, o primeiro passo é um teste que reproduz o bug. Ele prova a correção e vira a proteção contra regressão.

## Teste bom

| Qualidade | Bom | Ruim |
| --- | --- | --- |
| mínimo | uma coisa; "e" no nome significa dividir | `valida e-mail e domínio e espaços` |
| claro | o nome descreve o comportamento | `teste1` |
| mostra a intenção | demonstra a API desejada | esconde o que o código deve fazer |

- Antes de escrever, diga que mudança no código de produção faria esse teste falhar. Se não souber, o teste não protege nada.
- Afirme comportamento real, nunca o comportamento do mock. Um teste que só confere que o mock foi chamado testa o mock.
- Código só de teste fica em utilitário de teste, não em classe de produção.
- Antes de mockar uma dependência, entenda os efeitos colaterais dela. Prefira fake ou integração a mock quando der.
- Teste pelo comportamento público, não por função privada.
- Assertion significativa: "não lançou erro" não conta.

Teste difícil de escrever indica design confuso: simplifique a interface. Precisar mockar tudo indica acoplamento: injete a dependência.

## Estratégia

- Pirâmide: cerca de 70% unitário, 20% integração, 10% e2e.
- Mapeie cobertura por risco: lógica de negócio e cálculo primeiro, glue depois.
- Meta de cobertura (orientação): lógica de negócio crítica alta, API pública acima de 90%, geral acima de 80%, código gerado fora da conta. Cobertura não prova qualidade: confira que o teste falharia se o código estivesse errado.
- Integração com banco, Redis e fila: contra o serviço real em container, não contra mock do driver.

## Teste flaky

Ache a causa, não esconda: tempo, estado compartilhado, ambiente, data fixa no código. Correção certa: esperar uma condição (`waitFor`, canal, `Eventually`) em vez de `sleep`; limpar estado em `beforeEach` ou `t.Cleanup`; data relativa; container isolado. Retry e sleep em teste só mascaram. Para achar flaky em Go: `go test -count=10 -race ./...`.

## Go

Table-driven com subtests é o padrão:

```go
func TestParseConfig(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    *Config
		wantErr bool
	}{
		{name: "config válida", input: `{"host": "localhost", "port": 8080}`, want: &Config{Host: "localhost", Port: 8080}},
		{name: "JSON inválido", input: `{invalid}`, wantErr: true},
		{name: "entrada vazia", input: "", wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseConfig(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %+v; want %+v", got, tt.want)
			}
		})
	}
}
```

Para o primeiro vermelho, defina a assinatura com corpo `panic("not implemented")`, escreva o teste e veja ele falhar antes de implementar.

- `t.Helper()` em função auxiliar, `t.Cleanup()` para liberar recurso, `t.TempDir()` para arquivo temporário, `t.Parallel()` em teste independente.
- Dependência atrás de interface pequena, com fake escrito à mão (struct com campos de função) em vez de gerador, quando só alguns métodos importam.
- Handler HTTP com `httptest.NewRequest` e `httptest.NewRecorder`, em tabela com método, caminho, corpo, status e corpo esperados.
- Golden file em `testdata/` com flag `-update` para saídas grandes.
- Sem `time.Sleep`. Sem testar função privada. Erro e caminho de falha são testados, não só o caminho feliz.
- Fuzz (`FuzzXxx`) para parser e validação de entrada; benchmark (`-bench -benchmem`) só quando há questão de desempenho medida.

Comandos:

```bash
go test ./...
go test -run "TestUser/Create" ./...
go test -race ./...
go test -cover -coverprofile=coverage.out ./...
go tool cover -func=coverage.out
go test -count=10 ./...
```

## React

Teste o que o usuário vê e faz, não detalhe de implementação.

- Renderize com os mesmos providers de produção (um `renderWithProviders` em `test-utils`, com `QueryClient` sem retry).
- Interaja por query acessível e `userEvent`; afirme saída visível e efeito observável (callback chamado, request enviada).
- Não inspecione estado do componente, props passadas a filhos, hooks chamados nem número de renders.
- Ordem das queries: `getByRole` e `getByLabelText` primeiro, depois `getByAltText` e `getByTitle`, `getByTestId` por último. `queryBy*` para afirmar ausência; `findBy*` para o que aparece depois de trabalho assíncrono.
- `userEvent.setup()` uma vez por teste, sempre com `await`. Prefira `userEvent` a `fireEvent`.
- Assíncrono com `findBy*`, `waitFor` ou `waitForElementToBeRemoved`. Nunca `setTimeout` mais assertion.
- Rede com MSW, no nível da requisição, com `onUnhandledRequest: "error"` para que request sem mock falhe alto. Sobrescreva o handler no teste de erro (`server.use(...)`).
- Hook customizado com `renderHook`, mudanças de estado em `act`; crie o `QueryClient` uma vez por teste, fora do wrapper, ou o cache zera a cada render.
- Acessibilidade: `axe` em componente interativo pega label ausente, ARIA inválido e alt ausente; contraste real fica para o browser.
- Snapshot de DOM quebra a cada mudança de estilo e é aprovado no automático. Aceite só em função pura de serialização ou arquivo de configuração gerado.

Runner: o que o repo já usa (Vitest em Vite, Jest em outros). Não misture runners sem divisão clara.

## Analisar os testes de uma PR

1. Mapeie as funções, classes e módulos alterados e ache os testes correspondentes. Liste caminho novo sem teste.
2. Cobertura de comportamento: cada feature tem teste, os casos de borda e de erro estão cobertos, as integrações importantes também.
3. Qualidade: assertion significativa, padrões flaky (sleep, ordem, estado global), isolamento, nomes claros.
4. Lacunas por impacto: crítica (bug real passaria), importante, desejável.

Saída: resumo de cobertura, lacunas críticas, sugestões, e o que está bem. Num review de PR, só lacuna que esconde item bloqueante entra nos comentários (ver `rules/code-review.md`).

## Checklist

- [ ] Toda função ou método novo tem teste.
- [ ] Vi cada teste falhar antes de implementar, pelo motivo esperado.
- [ ] Escrevi o mínimo de código para passar.
- [ ] A suíte inteira passa com a saída limpa.
- [ ] Teste usa código real; mock só quando inevitável.
- [ ] Casos de borda e de erro cobertos.

Quando travar: escreva primeiro a API que você gostaria de ter e a assertion, depois o resto. Se travou por decisão que é do autor, devolva o bloco DÚVIDA (ver `rules/orquestrador.md`) em vez de escolher.

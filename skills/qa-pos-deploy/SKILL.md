---
name: qa-pos-deploy
description: Verifica uma URL depois do deploy em QA ou produção com um MCP de automação de browser: smoke test (erros de console, requests com falha, Core Web Vitals), interação (navegação, formulário, login), regressão visual em três larguras, acessibilidade e checagem de endpoints e assets, terminando num veredito. Use depois de deploy, de merge arriscado ou de upgrade de dependência, e para confirmar que uma correção resolveu. Não use para teste automatizado de CI nem sem browser MCP disponível.
metadata:
  origin: ecc
---

# QA pós-deploy

Dirige a página real como um usuário faria, por um MCP de browser (chrome-devtools, Playwright ou equivalente que a sessão tenha). Sem um desses, diga isso e pare: não finja verificação.

## Segurança primeiro

A verificação mexe em login e fluxo reais.

- O padrão é só leitura. Nunca rode fluxo que altera dado (compra, pagamento, exclusão, atualização em massa) contra produção. Fluxo mutante exige pedido explícito do autor e URL de QA ou preview.
- Use credenciais de teste, nunca login real. Se o perfil local não traz credencial de teste, peça.
- Tire dado sensível (credencial, token, dado pessoal) de screenshot e de relatório antes de salvar.

## Fase 1: smoke test

1. Abra a URL.
2. Leia o console e filtre ruído (analytics, terceiros). Conte só erro novo.
3. Liste as requests e procure 4xx e 5xx.
4. Tire screenshot da primeira dobra em desktop e em mobile.
5. Meça os Core Web Vitals: LCP abaixo de 2,5 s, CLS abaixo de 0,1, INP abaixo de 200 ms.

## Fase 2: interação

1. Clique em cada link de navegação e confira se nenhum está quebrado.
2. Envie formulário com dado válido e confira o estado de sucesso.
3. Envie com dado inválido e confira a mensagem de erro.
4. Fluxo de autenticação: login, página protegida, logout (só credencial de teste).
5. Jornadas críticas (busca, cadastro, checkout) só em leitura, ou em QA com pedido explícito.

## Fase 3: regressão visual

1. Screenshot das páginas principais em 375, 768 e 1440 px.
2. Compare com a baseline versionada. Sem baseline, o resultado é INCONCLUSIVO, nunca um PASS silencioso.
3. Aponte deslocamento de layout acima de 5 px, elemento ausente e overflow.
4. Confira o modo escuro, se existir.

## Fase 4: acessibilidade

1. Rode axe-core ou equivalente em cada página.
2. Aponte violações WCAG 2.2 AA (contraste, label, ordem de foco).
3. Navegue só por teclado de ponta a ponta.

O axe cobre perto de 30 a 40% do WCAG. Resultado limpo é necessário, não suficiente: teclado, ordem de foco e leitor de tela pedem checagem manual. Não escreva "acessível" só com base na execução automática.

## Fase 5: endpoints e assets

- Status HTTP da página e dos endpoints críticos, com tempo de resposta contra a baseline (acima de 2x é alerta).
- Assets estáticos (JS, CSS, imagem, fonte) respondendo 2xx ou 3xx com o content type esperado.
- Endpoints de stream (SSE) conectando e recebendo o primeiro evento ou heartbeat.
- Elementos-chave presentes: `h1`, navegação, rodapé, CTA principal.

## Limiares

Crítico, reporte já:
- status diferente de 200 na página;
- mais de 5 erros novos de console;
- LCP acima de 4 s;
- endpoint com 5xx;
- asset com 4xx ou 5xx;
- stream que não conecta ou cai antes do primeiro heartbeat.

Alerta, vai no relatório:
- LCP 500 ms acima da baseline, CLS acima de 0,1;
- warning novo de console;
- tempo de resposta acima de 2x a baseline;
- content type de asset mudou.

Informativo, só registro: variação pequena de desempenho, request nova (script de terceiro).

## Modos

- Passada única (padrão): verifica e relata.
- Vigilância: repete a cada N minutos durante a janela de lançamento. Só faça com o autor pedindo, e diga quando para.
- Comparação: QA contra produção, para achar diferença.

## Relatório

```markdown
## QA pós-deploy: <URL> (<data e hora>)

### Smoke test
- Console: 0 erros críticos, 2 warnings (ruído de analytics)
- Rede: tudo 200 ou 304
- Core Web Vitals: LCP 1,2 s, CLS 0,02, INP 89 ms

### Interação
- Navegação: 12 de 12 links
- Formulário de contato: sem estado de erro para e-mail inválido
- Login e logout: ok

### Visual
- Hero estoura em 375 px

### Acessibilidade
- 2 violações AA: alt ausente na imagem principal, contraste baixo nos links do rodapé

### Veredito: LIBERAR COM AJUSTES (2 itens, 0 bloqueantes)
```

Veredito: LIBERAR, LIBERAR COM AJUSTES, NÃO LIBERAR, ou INCONCLUSIVO (sem baseline visual ou sem como medir). Cada item reprovado traz o que foi visto, a página e o efeito.


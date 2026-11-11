---
name: qa
description: Valida uma entrega em QA depois do deploy numa develop, com a tela, os endpoints do contrato e a evidência guardada, e prepara o rascunho da solução técnica quando o perfil tem a extensão fim:qa. Use quando o card estiver em Aguardando Testes, o autor disser "valida em QA", "testa a PROJ-7 na develop" ou "junta a evidência". Não use antes do deploy nem para testar em produção (ver qa-pos-deploy para a checagem de tela).
---

# QA da entrega

QA confirma que o que a ADR prometeu funciona no ambiente. A evidência fica guardada na pasta da entrega.

## Pré-condição

1. O card está em Aguardando Testes e o deploy numa develop terminou. Confirme pelo Jira e pelo git (branch ou PR com merge na develop). Sem isso, pare.
2. Descubra o ambiente e a URL pelo perfil e pelo card. Se há mais de uma develop, pergunte qual tem a mudança. Não chute URL.

## Roteiro

1. Tela: use `qa-pos-deploy` na URL, seguindo o critério de aceite do card. Registre erros de console, requests com falha e o veredito.
2. Endpoints: para cada rota do contrato do card, rode `curl` contra o ambiente e confira status code e campos da response contra o contrato. Exemplo:

```bash
curl -s -X POST "$BASE_URL/cotacoes" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d @request.json
```

`$TOKEN` vem do ambiente do autor. Nunca grave o valor.
3. Cada item do critério de aceite termina em passa ou falha, com o motivo.

## Evidência

Guarde na pasta da entrega: screenshots, e request e response de cada endpoint. Remova token, cookie e dado pessoal antes de gravar. Nome de arquivo com a chave e o item de aceite.

## Solução técnica

Se o perfil tem uma extensão `extensoes[]` com `quando: fim:qa`, rode-a agora para preparar o rascunho da solução técnica (texto para produto, o que muda para quem usa). Sem a extensão, pule este passo.

Parada 1: mover ou comentar o card. Mostre o resultado por item de aceite, os arquivos de evidência e o rascunho da solução técnica. Só comente, anexe ou mude o status do card com aprovação explícita. Falha encontrada volta ao autor como item, sem mover o card.

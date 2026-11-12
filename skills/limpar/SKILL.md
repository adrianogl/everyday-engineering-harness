---
name: limpar
description: Limpa código que funciona mas ficou inchado, repetido, com camadas inúteis ou pouco testado (cleanup de código gerado, simplificação do que foi mexido na sessão), sem mudar comportamento. Use quando o autor pedir deslop, simplificar, limpar ou "tirar o lixo" de um módulo ou das mudanças recentes. Não use para feature nova, redesign amplo, refactor sem intenção de simplificar nem quando o comportamento está confuso demais para ser protegido por teste.
metadata:
  origin: omc
---

# Limpar

Limpeza em passes pequenos, apagando antes de acrescentar, com o comportamento travado por teste. O escopo é o que o autor indicou ou o que foi alterado na sessão; não se expande sozinho.

Numa branch, sem escopo indicado, o padrão é o que a branch introduziu: o diff contra a branch de onde ela saiu (`git merge-base`), ou contra a principal. Problema que já existia fora desse diff entra no relatório como item para depois, sem edição.

## Postura

- O comportamento não muda, a menos que o autor peça.
- Travar o comportamento com teste focado antes de editar, sempre que der.
- Apagar vale mais que acrescentar. Reaproveite utilitário e padrão que já existem antes de criar outro.
- Sem dependência nova.
- Diff pequeno, reversível, focado num tipo de problema por vez.
- Código mais claro, não mais curto: aninhamento de ternário e one-liner denso são o oposto de simplificar. Prefira `if`/`else` ou `switch`.
- Não troque a convenção do projeto por preferência pessoal (estilo, nomes, estrutura). Siga os arquivos vizinhos e as regras do repo.
- Na dúvida se uma mudança preserva o comportamento, deixe o código como está.

## Fluxo

1. Proteja o comportamento atual. Diga o que não pode mudar. Rode ou escreva o teste mais estreito que cobre isso antes de editar. Se não for possível testar antes, registre o plano de verificação antes de mexer.
2. Escreva o plano de limpeza antes do código: limite o escopo, liste os problemas concretos e ordene do mais seguro (apagar) ao mais arriscado (consolidar).
3. Classifique o que encontrou:
   - duplicação: lógica repetida, branches copiados, helpers redundantes;
   - código morto: não usado, branch inalcançável, flag velha, resto de debug;
   - abstração desnecessária: wrapper que só repassa, indireção especulativa, helper de uso único;
   - violação de fronteira: acoplamento escondido, responsabilidade na camada errada, import ou efeito colateral fora do lugar;
   - falta de teste: comportamento sem cobertura, caso de borda aberto.
4. Faça um passe por tipo, nesta ordem, rodando a verificação focada ao fim de cada um:
   1. apagar código morto;
   2. remover duplicação;
   3. limpar nomes e tratamento de erro;
   4. reforçar teste.
   Não misture refactors sem relação no mesmo conjunto de edições.
5. Rode os gates: testes verdes, lint, typecheck e os testes do trecho tocado. Se um gate falha, corrija ou desfaça a limpeza arriscada em vez de forçá-la.
6. Reporte com evidência:
   - arquivos alterados;
   - o que foi simplificado;
   - como o comportamento foi travado e o que foi rodado;
   - riscos que sobraram.

## Comentários

Remova comentário que repete o que o código já diz. Não apague o que explica uma decisão não óbvia. Não acrescente comentário novo ao limpar; a regra de comentários está em `rules/comments.md`.

## Modo revisor

Quando o autor pedir só a revisão de uma limpeza já feita, não edite. Leia o plano, os arquivos alterados e a evidência de teste, e procure:

- código morto ou export sem uso que sobrou;
- duplicação que devia ter sido consolidada;
- wrapper ou abstração que ainda embaralha a fronteira;
- teste faltando ou verificação fraca para o comportamento preservado;
- limpeza que mudou comportamento sem intenção.

Devolva o veredito com o que precisa mudar e deixe a correção para outro passe de escrita. Quem escreveu a limpeza não aprova o próprio trabalho no mesmo contexto.

## Bom e mau encaixe

- Bom: "limpa esse módulo: wrapper demais, helper duplicado e código morto".
- Bom: "enxuga src/auth sem mudar comportamento".
- Mau: "refatora auth para ter login SSO" (é feature).
- Mau: "arruma a formatação" (é formatador, não limpeza).

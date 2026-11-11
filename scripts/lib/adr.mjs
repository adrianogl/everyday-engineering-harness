const TITULO = /^(#{2,3})\s+(.+?)\s*$/
const NUMERADO = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/
const CAMPO = /^-\s+\*\*(Obrigatoriedade|Gate|Completo quando):\*\*\s*(.*?)\s*$/

function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function identificar(texto) {
  if (semAcento(texto).toLowerCase() === 'cabecalho') return { id: 'cabecalho', titulo: texto }
  const m = NUMERADO.exec(texto)
  return m ? { id: m[1], titulo: m[2] } : null
}

function normalizarObrigatoriedade(texto) {
  const normalizado = semAcento(texto).toUpperCase()
  if (/^OBRIGATORIO\b/.test(normalizado)) return 'OBRIGATORIO'
  if (/^CONDICIONAL\b/.test(normalizado)) return 'CONDICIONAL'
  return null
}

export function parseSecoes(markdown) {
  const secoes = []
  let atual = null
  for (const linha of String(markdown).split(/\r?\n/)) {
    const titulo = TITULO.exec(linha)
    if (titulo) {
      const identificada = identificar(titulo[2])
      if (identificada) {
        atual = { ...identificada, obrigatoriedade: null, gate: null, completoQuando: null }
        secoes.push(atual)
      }
      continue
    }
    if (!atual) continue
    const campo = CAMPO.exec(linha)
    if (!campo) continue
    if (campo[1] === 'Obrigatoriedade') atual.obrigatoriedade = normalizarObrigatoriedade(campo[2])
    else if (campo[1] === 'Gate') atual.gate = campo[2]
    else atual.completoQuando = campo[2]
  }
  return secoes
}

export function checklist(secoes) {
  return secoes
    .filter((s) => s.obrigatoriedade || s.gate || s.completoQuando)
    .map((s) => `- [ ] ${s.id} ${s.titulo} (${s.obrigatoriedade ?? 'sem obrigatoriedade'}): ${s.completoQuando ?? ''}`.trimEnd())
    .join('\n')
}

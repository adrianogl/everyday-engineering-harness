const ARQUIVO_IGNORADO = 'tests/sanitize.test.mjs'
const DOMINIOS_PERMITIDOS = ['exemplo.com', 'example.com']
const UUID_NULO = '00000000-0000-0000-0000-000000000000'

const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const ATLASSIAN = /\d{6}:[0-9a-f-]{36}/gi

function escapar(termo) {
  return termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function dominioPermitido(dominio) {
  const d = dominio.toLowerCase()
  return DOMINIOS_PERMITIDOS.some((p) => d === p || d.endsWith(`.${p}`))
}

function achadosDaLinha(linha, denylist) {
  const achados = []
  const ocupados = []

  for (const m of linha.matchAll(ATLASSIAN)) {
    achados.push({ regra: 'atlassian-account', trecho: m[0] })
    ocupados.push([m.index, m.index + m[0].length])
  }
  for (const m of linha.matchAll(UUID)) {
    const dentro = ocupados.some(([ini, fim]) => m.index >= ini && m.index < fim)
    if (dentro || m[0].toLowerCase() === UUID_NULO) continue
    achados.push({ regra: 'uuid', trecho: m[0] })
  }
  for (const m of linha.matchAll(EMAIL)) {
    if (dominioPermitido(m[1])) continue
    achados.push({ regra: 'email', trecho: m[0] })
  }
  for (const termo of denylist) {
    if (typeof termo !== 'string' || termo.trim() === '') continue
    const re = new RegExp(`(?<![\\p{L}\\p{N}_])${escapar(termo.trim())}(?![\\p{L}\\p{N}_])`, 'giu')
    for (const m of linha.matchAll(re)) {
      achados.push({ regra: 'denylist', trecho: m[0] })
    }
  }
  return achados
}

export function scan(arquivos, denylist = []) {
  const resultado = []
  for (const { caminho, conteudo } of arquivos) {
    if (caminho === ARQUIVO_IGNORADO) continue
    conteudo.split('\n').forEach((linha, i) => {
      for (const achado of achadosDaLinha(linha, denylist)) {
        resultado.push({ caminho, linha: i + 1, ...achado })
      }
    })
  }
  return resultado
}

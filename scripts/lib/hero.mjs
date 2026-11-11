import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ROTEIRO } from './terminal.mjs'

const TIPOS = [
  ['command', 'Commands'],
  ['skill', 'Skills'],
  ['agent', 'Agents'],
]
const FONTE = 'Fira Code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
export const LINHAS_VISIVEIS = 9
export const REPO = 'adrianogl/everyday-engineering-harness'

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function contarParadas({ raiz }) {
  const pasta = join(raiz, 'commands')
  if (!existsSync(pasta)) return 0
  let total = 0
  for (const nome of readdirSync(pasta)) {
    if (!nome.endsWith('.md')) continue
    const texto = readFileSync(join(pasta, nome), 'utf8')
    total += new Set([...texto.matchAll(/Parada (\d+):/g)].map((m) => m[1])).size
  }
  return total
}

export function nomeExibido(peca) {
  return peca.tipo === 'command' ? `/eeh:${peca.nome}` : peca.nome
}

export function colunas(catalogo) {
  return TIPOS.map(([tipo, titulo]) => {
    const pecas = catalogo.pecas.filter((p) => p.tipo === tipo)
    const visiveis = pecas.slice(0, LINHAS_VISIVEIS)
    return { tipo, titulo, total: pecas.length, nomes: visiveis.map(nomeExibido), resto: pecas.length - visiveis.length }
  })
}

function opacidade(i, n, resto) {
  if (!resto) return 1
  if (i === n - 1) return 0.25
  if (i === n - 2) return 0.55
  return 1
}

function linhaTerminal({ tipo, texto }, x, y) {
  const xt = x + 30
  if (tipo === 'pedido') {
    const citado = 'cotação'
    const i = texto.indexOf(citado)
    const miolo = i === -1 ? escapar(texto) : `${escapar(texto.slice(0, i))}<tspan fill="#f1fa8c">${citado}</tspan>${escapar(texto.slice(i + citado.length))}`
    return `<text x="${x}" y="${y}" fill="#50fa7b">›</text><text x="${xt}" y="${y}" fill="#f8f8f2">${miolo}</text>`
  }
  if (tipo === 'ok') return `<text x="${x}" y="${y}" fill="#8be9fd">✓</text><text x="${xt}" y="${y}" fill="#f8f8f2">${escapar(texto)}</text>`
  return `<text x="${x}" y="${y}" fill="#ff5555">■</text><text x="${xt}" y="${y}" fill="#ff5555">${escapar(texto)}</text>`
}

export function heroSvg(catalogo, roteiro = ROTEIRO, paradas = 0) {
  const p = []
  p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="eeh: ${catalogo.pecas.length} pieces, ${paradas} approval stops">`)
  p.push('<rect width="1600" height="900" fill="#282a36"/>')
  p.push(`<g font-family="${FONTE}">`)
  p.push('<rect x="80" y="52" width="40" height="46" rx="4" fill="#50fa7b"/>')
  p.push('<text x="100" y="87" font-size="36" font-weight="700" fill="#282a36" text-anchor="middle">e</text>')
  p.push('<text x="124" y="87" font-size="36" font-weight="700" fill="#f8f8f2">eh</text>')
  p.push(`<text x="200" y="84" font-size="20" fill="#6272a4">${REPO}</text>`)
  p.push('<text x="1520" y="84" font-size="20" fill="#6272a4" text-anchor="end">MIT</text>')
  p.push('<line x1="80" y1="128" x2="1520" y2="128" stroke="#44475a"/>')

  const titulo = ['Turns a plain request', 'into design docs, cards, code,', 'reviews and QA, and']
  titulo.forEach((t, i) => p.push(`<text x="80" y="${210 + i * 52}" font-size="40" font-weight="600" fill="#f8f8f2">${t}</text>`))
  p.push(`<text x="80" y="${210 + 3 * 52}" font-size="40" font-weight="600" fill="#50fa7b">stops for your approval.</text>`)
  p.push('<text x="80" y="420" font-size="20" fill="#6272a4">A Claude Code plugin for daily engineering work.</text>')

  const yT = 470
  p.push(`<rect x="80" y="${yT}" width="620" height="${60 + roteiro.length * 44}" rx="8" fill="#21222c" stroke="#44475a"/>`)
  roteiro.forEach((l, i) => p.push(`<g font-size="20">${linhaTerminal(l, 108, yT + 50 + i * 44)}</g>`))

  colunas(catalogo).forEach((c, k) => {
    const x = 760 + k * 260
    p.push(`<rect x="${x}" y="160" width="240" height="560" rx="8" fill="#282a36" stroke="#44475a"/>`)
    p.push(`<text x="${x + 18}" y="212" font-size="20" fill="#f8f8f2">${c.titulo}</text>`)
    p.push(`<text x="${x + 222}" y="220" font-size="48" font-weight="600" fill="#f8f8f2" text-anchor="end">${c.total}</text>`)
    p.push(`<line x1="${x + 18}" y1="244" x2="${x + 222}" y2="244" stroke="#44475a"/>`)
    c.nomes.forEach((nome, i) => {
      const y = 262 + i * 44
      const destaque = i === 0
      const op = opacidade(i, c.nomes.length, c.resto)
      p.push(`<g opacity="${op}"><rect x="${x + 14}" y="${y}" width="212" height="36" rx="4" fill="#21222c" stroke="${destaque ? '#50fa7b' : '#44475a'}"/><text x="${x + 26}" y="${y + 24}" font-size="15" fill="${destaque ? '#50fa7b' : '#f8f8f2'}">${escapar(nome)}</text></g>`)
    })
    if (c.resto) p.push(`<text x="${x + 18}" y="698" font-size="16" fill="#f8f8f2" fill-opacity="0.72">+ ${c.resto} more</text>`)
  })

  p.push('<line x1="80" y1="780" x2="1520" y2="780" stroke="#44475a"/>')
  const tiras = [
    [String(catalogo.pecas.length), 'pieces'],
    [String(paradas), 'approval stops'],
    ['MIT', 'license'],
  ]
  tiras.forEach(([n, rotulo], i) => {
    const x = 80 + i * 360
    p.push(`<text x="${x}" y="852" font-size="44" font-weight="600" fill="#f8f8f2">${n}</text>`)
    p.push(`<text x="${x + n.length * 27 + 16}" y="850" font-size="18" fill="#f8f8f2" fill-opacity="0.72">${rotulo}</text>`)
  })
  p.push('</g>', '</svg>', '')
  return p.join('\n')
}

export const LIMITES_SITE = { celular: 4, tablet: LINHAS_VISIVEIS, largo: 14 }

function classesDaLinha(i, n, total) {
  const classes = []
  if (i >= LIMITES_SITE.celular) classes.push('fora-celular')
  if (i >= LIMITES_SITE.tablet) classes.push('fora-tablet')
  for (const [faixa, limite] of Object.entries(LIMITES_SITE)) {
    const visiveis = Math.min(limite, n)
    if (total <= visiveis) continue
    if (i === visiveis - 2) classes.push(`esmaece-1-${faixa}`)
    if (i === visiveis - 1) classes.push(`esmaece-2-${faixa}`)
  }
  return classes
}

export function blocoSiteHero(catalogo, paradas) {
  const l = ['<!-- hero-site:inicio -->', '<div class="colunas">']
  for (const [tipo, titulo] of TIPOS) {
    const pecas = catalogo.pecas.filter((p) => p.tipo === tipo)
    const linhas = pecas.slice(0, LIMITES_SITE.largo)
    l.push(`<section class="coluna" data-tipo="${tipo}">`)
    l.push(`<h2 class="coluna-topo"><span>${titulo}</span><b>${pecas.length}</b></h2>`)
    l.push('<ul>')
    linhas.forEach((p, i) => {
      const classes = classesDaLinha(i, linhas.length, pecas.length)
      l.push(`<li${classes.length ? ` class="${classes.join(' ')}"` : ''}>${escapar(nomeExibido(p))}</li>`)
    })
    l.push('</ul>')
    for (const [faixa, limite] of Object.entries(LIMITES_SITE)) {
      const resto = pecas.length - Math.min(limite, pecas.length)
      if (resto > 0) l.push(`<p class="mais mais-${faixa}">+ ${resto} <span data-i18n="hero.mais">more</span></p>`)
    }
    l.push('</section>')
  }
  l.push('</div>')
  l.push('<dl class="tira">')
  l.push(`<div><dt>${catalogo.pecas.length}</dt><dd data-i18n="hero.pecas">pieces</dd></div>`)
  l.push(`<div><dt>${paradas}</dt><dd data-i18n="hero.paradas">approval stops</dd></div>`)
  l.push('<div><dt>MIT</dt><dd data-i18n="hero.licenca">license</dd></div>')
  l.push('</dl>')
  l.push('<!-- hero-site:fim -->')
  return l.join('\n')
}

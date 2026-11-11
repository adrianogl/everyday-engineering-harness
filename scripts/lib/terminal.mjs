export const ROTEIRO = [
  { tipo: 'pedido', texto: 'quebra o documento técnico da cotação' },
  { tipo: 'ok', texto: 'conferente: 1 conflito documento × Figma' },
  { tipo: 'ok', texto: '2 cards: frete-api, frete-web' },
  { tipo: 'parada', texto: 'Parada 2: criar cards' },
]

const FONTE = 'Fira Code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const LARGURA = 640
const MARGEM = 28
const TOPO = 44
const PASSO = 36

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function linhaDe({ tipo, texto }, y) {
  const x = MARGEM
  const xTexto = MARGEM + 28
  if (tipo === 'pedido') {
    const citado = 'cotação'
    const i = texto.indexOf(citado)
    const antes = i === -1 ? texto : texto.slice(0, i)
    const depois = i === -1 ? '' : texto.slice(i + citado.length)
    const miolo = i === -1 ? '' : `<tspan fill="#f1fa8c">${escapar(citado)}</tspan>`
    return `<text x="${x}" y="${y}" fill="#50fa7b">›</text><text x="${xTexto}" y="${y}" fill="#f8f8f2">${escapar(antes)}${miolo}${escapar(depois)}</text>`
  }
  if (tipo === 'ok') {
    return `<text x="${x}" y="${y}" fill="#8be9fd">✓</text><text x="${xTexto}" y="${y}" fill="#f8f8f2">${escapar(texto)}</text>`
  }
  return `<text x="${x}" y="${y}" fill="#ff5555">■</text><text x="${xTexto}" y="${y}" fill="#ff5555">${escapar(texto)}</text>`
}

export function terminalSvg(roteiro = ROTEIRO) {
  const altura = TOPO + roteiro.length * PASSO + 20
  const linhas = roteiro.map((l, i) => linhaDe(l, TOPO + i * PASSO)).join('\n    ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGURA}" height="${altura}" viewBox="0 0 ${LARGURA} ${altura}" role="img" aria-label="Exemplo de sessão do eeh no terminal">
  <rect width="${LARGURA}" height="${altura}" fill="#282a36"/>
  <rect x="8" y="8" width="${LARGURA - 16}" height="${altura - 16}" rx="8" fill="#21222c" stroke="#44475a" stroke-width="1"/>
  <g font-family="${FONTE}" font-size="16">
    ${linhas}
  </g>
</svg>
`
}

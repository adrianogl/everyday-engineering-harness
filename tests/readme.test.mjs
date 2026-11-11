import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { conferir } from '../scripts/lib/catalogo.mjs'
import { ROTEIRO, terminalSvg } from '../scripts/lib/terminal.mjs'
import { contarParadas, heroSvg } from '../scripts/lib/hero.mjs'
import { scan } from '../scripts/lib/sanitize.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ler = (arquivo) => readFileSync(join(raiz, arquivo), 'utf8')

test('terminalSvg usa as cores da parada e do ok', () => {
  const svg = terminalSvg(ROTEIRO)
  assert.match(svg, /fill="#50fa7b">›/)
  assert.match(svg, /<tspan fill="#f1fa8c">cotação<\/tspan>/)
  assert.match(svg, /fill="#8be9fd">✓/)
  assert.match(svg, /fill="#ff5555">■/)
  assert.match(svg, /fill="#ff5555">Parada 2: criar cards/)
  assert.match(svg, /font-family="Fira Code, ui-monospace/)
  assert.doesNotMatch(svg, /<script|gradient/i)
})

test('site/hero.svg está em dia', () => {
  assert.ok(existsSync(join(raiz, 'site/hero.svg')))
  const catalogo = JSON.parse(ler('site/catalogo.json'))
  assert.equal(ler('site/hero.svg'), heroSvg(catalogo, ROTEIRO, contarParadas({ raiz })))
  assert.deepEqual(conferir({ raiz }).filter((d) => d.startsWith('site/hero.svg')), [])
})

test('hero.svg mostra as contagens do catalogo.json e as paradas reais', () => {
  const svg = ler('site/hero.svg')
  const { contagem, pecas } = JSON.parse(ler('site/catalogo.json'))
  for (const n of Object.values(contagem)) assert.match(svg, new RegExp(`text-anchor="end">${n}</text>`))
  assert.match(svg, new RegExp(`>${pecas.length}</text>`))
  const paradas = contarParadas({ raiz })
  assert.ok(paradas > 0)
  assert.match(svg, new RegExp(`>${paradas}</text>[\\s\\S]{0,200}>approval stops<`))
  assert.match(svg, /fill="#ff5555">Parada 2: criar cards/)
})

test('hero.svg usa só as cores da paleta', () => {
  const paleta = ['#282a36', '#21222c', '#44475a', '#f8f8f2', '#6272a4', '#50fa7b', '#8be9fd', '#f1fa8c', '#ff5555']
  const cores = [...ler('site/hero.svg').matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase())
  assert.ok(cores.length > 0)
  for (const c of cores) assert.ok(paleta.includes(c), c)
  assert.doesNotMatch(ler('site/hero.svg'), /gradient|filter|rgba/i)
})

test('README.md e README.pt-BR.md têm o bloco do catálogo em dia, o link um para o outro, os 7 commands na tabela de fases e os créditos ECC, OMC, superpowers e Dracula', () => {
  assert.deepEqual(conferir({ raiz }), [])
  const en = ler('README.md')
  const pt = ler('README.pt-BR.md')
  for (const texto of [en, pt]) {
    assert.match(texto, /<!-- catalogo:inicio -->/)
    assert.match(texto, /site\/hero\.svg/)
    for (const c of ['documento', 'comentarios', 'quebrar', 'implementar', 'review', 'qa', 'fontes']) {
      assert.match(texto, new RegExp(`^\\| \`/eeh:${c}[ \`][^|]*\\|[^|]+\\|[^|]+\\|$`, 'm'))
    }
    for (const nome of ['everything-claude-code', 'oh-my-claudecode', 'obra/superpowers', 'Dracula']) {
      assert.ok(texto.includes(nome), nome)
    }
  }
  assert.match(en, /\]\(README\.pt-BR\.md\)/)
  assert.match(pt, /\]\(README\.md\)/)
})

test('README.pt-BR.md passa pelo sanitizer', () => {
  assert.deepEqual(scan([{ caminho: 'README.pt-BR.md', conteudo: ler('README.pt-BR.md') }], []), [])
  assert.deepEqual(scan([{ caminho: 'README.md', conteudo: ler('README.md') }], []), [])
})

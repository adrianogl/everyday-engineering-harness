import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { conferir } from '../scripts/lib/catalogo.mjs'
import { ROTEIRO, terminalSvg } from '../scripts/lib/terminal.mjs'
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

test('site/terminal.svg está em dia', () => {
  assert.ok(existsSync(join(raiz, 'site/terminal.svg')))
  assert.equal(ler('site/terminal.svg'), terminalSvg(ROTEIRO))
  assert.deepEqual(conferir({ raiz }).filter((d) => d.startsWith('site/terminal.svg')), [])
})

test('README.md e README.pt-BR.md têm o bloco do catálogo em dia, o link um para o outro, os 7 commands na tabela de fases e os créditos ECC, OMC, superpowers e Dracula', () => {
  assert.deepEqual(conferir({ raiz }), [])
  const en = ler('README.md')
  const pt = ler('README.pt-BR.md')
  for (const texto of [en, pt]) {
    assert.match(texto, /<!-- catalogo:inicio -->/)
    assert.match(texto, /site\/terminal\.svg/)
    for (const c of ['adr', 'adr-revisar', 'quebrar', 'implementar', 'review', 'qa', 'upstream']) {
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

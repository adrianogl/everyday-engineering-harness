import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROTEIRO } from '../scripts/lib/terminal.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ler = (arquivo) => readFileSync(join(raiz, arquivo), 'utf8')
const PALETA = ['#282a36', '#21222c', '#44475a', '#f8f8f2', '#6272a4', '#50fa7b', '#8be9fd', '#f1fa8c', '#ff5555']

test('index.html só carrega scripts locais e a fonte do Google', () => {
  const html = ler('site/index.html')
  const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1])
  assert.ok(scripts.length > 0)
  for (const src of scripts) assert.doesNotMatch(src, /^(https?:)?\/\//)
  const links = [...html.matchAll(/<link[^>]*\shref="([^"]+)"/g)].map((m) => m[1])
  for (const href of links.filter((h) => /^(https?:)?\/\//.test(h))) {
    assert.match(href, /^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/)
  }
  assert.ok(links.some((h) => h.includes('family=Fira+Code')))
})

test('toda chave data-i18n existe em en e pt', () => {
  const html = ler('site/index.html')
  const i18n = JSON.parse(ler('site/i18n.json'))
  const chaves = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1])
  assert.ok(chaves.length > 20)
  for (const c of chaves) {
    assert.ok(c in i18n.en, `en sem ${c}`)
    assert.ok(c in i18n.pt, `pt sem ${c}`)
  }
  assert.deepEqual(Object.keys(i18n.en).sort(), Object.keys(i18n.pt).sort())
})

test('index.html contém o estado final do roteiro e uma linha por peça do catálogo', () => {
  const html = ler('site/index.html')
  for (const { texto } of ROTEIRO) {
    const semMarcacao = html.replace(/<[^>]+>/g, '')
    assert.ok(semMarcacao.includes(texto), `falta ${texto}`)
  }
  const catalogo = JSON.parse(ler('site/catalogo.json'))
  const linhas = [...html.matchAll(/<li class="peca" data-tipo="(\w+)"/g)]
  assert.equal(linhas.length, catalogo.pecas.length)
  for (const p of catalogo.pecas) assert.ok(html.includes(`>${p.tipo === 'command' ? `/eeh:${p.nome}` : p.nome}</code>`), p.nome)
})

test('estilo.css usa só as cores da paleta', () => {
  const css = ler('site/estilo.css')
  const cores = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase())
  assert.ok(cores.length > 0)
  for (const c of cores) assert.ok(PALETA.includes(c), `cor fora da paleta: ${c}`)
  assert.doesNotMatch(css, /rgba?\(|hsla?\(|gradient/)
})

test('estilo.css não tem largura fixa acima de 360px fora de media query', () => {
  let css = ler('site/estilo.css')
  let i
  while ((i = css.indexOf('@media')) !== -1) {
    let j = css.indexOf('{', i)
    let nivel = 1
    for (j += 1; nivel > 0 && j < css.length; j += 1) {
      if (css[j] === '{') nivel += 1
      else if (css[j] === '}') nivel -= 1
    }
    css = css.slice(0, i) + css.slice(j)
  }
  for (const m of css.matchAll(/(?<![\w-])(min-width|width)\s*:\s*(\d+)px/g)) {
    assert.ok(Number(m[2]) <= 360, `${m[0]}`)
  }
})

test('index.html tem os créditos e o link do repo', () => {
  const html = ler('site/index.html')
  for (const url of ['https://github.com/affaan-m/everything-claude-code', 'https://github.com/Yeachan-Heo/oh-my-claudecode', 'https://github.com/obra/superpowers', 'https://draculatheme.com']) {
    assert.ok(html.includes(`href="${url}"`), url)
  }
  assert.match(html, /Zeno Rocha/)
  assert.ok(html.includes('href="https://github.com/adrianogl/everyday-engineering-harness"'))
})

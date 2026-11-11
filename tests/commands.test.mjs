import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const raiz = 'commands'
const arquivos = existsSync(raiz) ? readdirSync(raiz).filter((f) => f.endsWith('.md')) : []

function ler(nome) {
  return readFileSync(join(raiz, `${nome}.md`), 'utf8')
}

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/)
  assert.ok(m, 'command sem frontmatter')
  const campos = {}
  for (const linha of m[1].split('\n')) {
    const campo = linha.match(/^([\w-]+):\s*(.*)$/)
    if (campo) campos[campo[1]] = campo[2]
  }
  return campos
}

test('commands têm description e argument-hint', () => {
  assert.deepEqual(arquivos.sort(), ['implementar.md', 'review.md'])
  for (const arquivo of arquivos) {
    const campos = frontmatter(ler(arquivo.replace(/\.md$/, '')))
    assert.ok(campos.description && campos.description.length > 20, `${arquivo} sem description`)
    assert.ok(campos['argument-hint'], `${arquivo} sem argument-hint`)
  }
})

test('implementar menciona as três paradas', () => {
  const texto = ler('implementar')
  for (const parada of ['Parada 1: plano', 'Parada 2: commit', 'Parada 3: PR']) {
    assert.ok(texto.includes(parada), `sem ${parada}`)
  }
})

test('implementar usa registros, worktree e extensões fim:implementar', () => {
  const texto = ler('implementar')
  for (const trecho of ['registros.mjs', 'worktree', 'fim:implementar', 'anexo', 'comentário', '/eeh:review', 'verifier', 'test-engineer']) {
    assert.ok(texto.includes(trecho), `implementar sem ${trecho}`)
  }
})

test('review mapeia extensões para reviewers', () => {
  const texto = ler('review')
  const pares = [
    ['.go', 'reviewer-go'],
    ['.ts', 'reviewer-typescript'],
    ['.tsx', 'reviewer-react'],
    ['.sql', 'reviewer-database'],
  ]
  for (const [extensao, reviewer] of pares) {
    assert.ok(texto.includes(extensao) && texto.includes(reviewer), `sem ${extensao} -> ${reviewer}`)
  }
  for (const sempre of ['code-reviewer', 'silent-failure-hunter', 'security-reviewer']) {
    assert.ok(texto.includes(sempre), `sem ${sempre}`)
  }
})

test('review exige dois reviewers, entrega o diff e para antes de postar', () => {
  const texto = ler('review')
  assert.match(texto, /dois reviewers/i)
  assert.match(texto, /somente leitura|só leem|Read, Grep e Glob/i)
  assert.ok(texto.includes('Para antes de postar comentário na PR ou no card'))
})

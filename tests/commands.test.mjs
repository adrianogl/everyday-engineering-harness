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
  assert.deepEqual(arquivos.sort(), ['comentarios.md', 'documento.md', 'fontes.md', 'implementar.md', 'qa.md', 'quebrar.md', 'review.md'])
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

test('commands novos trazem as paradas com rótulo exato', () => {
  const paradas = {
    documento: ['Parada 1: dúvidas', 'Parada 2: publicar'],
    'comentarios': ['Parada 1: atualizar a página'],
    quebrar: ['Parada 1: conflitos', 'Parada 2: criar cards'],
    qa: ['Parada 1: mover ou comentar o card'],
  }
  for (const [nome, rotulos] of Object.entries(paradas)) {
    const texto = ler(nome)
    for (const rotulo of rotulos) assert.ok(texto.includes(rotulo), `${nome} sem ${rotulo}`)
  }
})

test('quebrar cita A fazer e accountId', () => {
  const texto = ler('quebrar')
  assert.ok(texto.includes('A fazer'))
  assert.ok(texto.includes('accountId'))
})

test('review usa o histórico de rodadas', () => {
  const texto = ler('review')
  assert.ok(texto.includes('reviews.mjs'))
  assert.ok(texto.includes('rodada'))
})

test('orquestrador não tem rota em breve e tem a fase qa', () => {
  const texto = readFileSync(join('rules', 'orquestrador.md'), 'utf8')
  assert.ok(!texto.includes('(em breve)'))
  assert.match(texto, /fase `qa`/)
})

test('fontes para antes de incorporar e usa o CLI inteiro', () => {
  const texto = ler('fontes')
  assert.ok(texto.includes('Parada 1: incorporar'))
  for (const trecho of ['fontes.mjs buscar', 'fontes.mjs diff', 'fontes.mjs novos', 'fontes.mjs registrar', 'manutencao-pacote', 'docs/triagem.tsv']) {
    assert.ok(texto.includes(trecho), `fontes sem ${trecho}`)
  }
  assert.match(texto, /não sobrescreva|não copie/i)
  assert.ok(texto.includes('erro'))
})

test('orquestrador tem a rota fontes', () => {
  const texto = readFileSync(join('rules', 'orquestrador.md'), 'utf8')
  assert.match(texto, /fase `fontes`/)
})

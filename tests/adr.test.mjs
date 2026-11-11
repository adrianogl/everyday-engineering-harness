import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSecoes, checklist } from '../scripts/lib/adr.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = readFileSync(join(raiz, 'tests', 'fixtures', 'adr-template.md'), 'utf8')

test('parseSecoes lê obrigatoriedade, gate e completo quando', () => {
  const secoes = parseSecoes(fixture)
  assert.deepEqual(secoes.filter((s) => ['cabecalho', '1', '2.1'].includes(s.id)), [
    { id: 'cabecalho', titulo: 'Cabeçalho', obrigatoriedade: 'OBRIGATORIO', gate: 'Status definido antes de abrir o review', completoQuando: 'Título, autor, data e status estão preenchidos' },
    { id: '1', titulo: 'Referências', obrigatoriedade: 'OBRIGATORIO', gate: 'Nenhum', completoQuando: 'Todo link aponta para um documento acessível' },
    { id: '2.1', titulo: 'Visão geral e limites', obrigatoriedade: 'CONDICIONAL', gate: 'Parada antes de propor mudança', completoQuando: 'Fluxo atual descrito com os limites do `frete-api`' }
  ])
})

test('seção sem regra vem com null', () => {
  const secao = parseSecoes(fixture).find((s) => s.id === '2.2')
  assert.deepEqual(secao, { id: '2.2', titulo: 'Notas soltas', obrigatoriedade: null, gate: null, completoQuando: null })
})

test('OBRIGATORIO sem acento vira OBRIGATORIO', () => {
  const secao = parseSecoes(fixture).find((s) => s.id === '10')
  assert.equal(secao.obrigatoriedade, 'OBRIGATORIO')
})

test('checklist pula seção sem regra', () => {
  const linhas = checklist(parseSecoes(fixture)).split('\n')
  assert.equal(linhas.length, 4)
  assert.equal(linhas[0], '- [ ] cabecalho Cabeçalho (OBRIGATORIO): Título, autor, data e status estão preenchidos')
  assert.ok(!linhas.some((l) => l.includes('Notas soltas')))
})

test('template de exemplo tem regra em toda seção numerada', () => {
  const exemplo = readFileSync(join(raiz, 'templates', 'adr-exemplo.md'), 'utf8')
  const secoes = parseSecoes(exemplo)
  assert.ok(secoes.length >= 9)
  for (const s of secoes) {
    assert.ok(s.obrigatoriedade, `seção ${s.id} sem obrigatoriedade`)
    assert.ok(s.gate, `seção ${s.id} sem gate`)
    assert.ok(s.completoQuando, `seção ${s.id} sem completo quando`)
  }
})

test('CLI com arquivo ausente sai com 1', () => {
  const r = spawnSync('node', [join(raiz, 'scripts', 'adr.mjs'), 'secoes', '/nao/existe.md'], { encoding: 'utf8' })
  assert.equal(r.status, 1)
  assert.ok(r.stderr.length > 0)
})

test('CLI secoes e checklist imprimem a saída', () => {
  const caminho = join(raiz, 'tests', 'fixtures', 'adr-template.md')
  const secoes = spawnSync('node', [join(raiz, 'scripts', 'adr.mjs'), 'secoes', caminho], { encoding: 'utf8' })
  assert.equal(JSON.parse(secoes.stdout).length, 6)
  const lista = spawnSync('node', [join(raiz, 'scripts', 'adr.mjs'), 'checklist', caminho], { encoding: 'utf8' })
  assert.match(lista.stdout, /^- \[ \] cabecalho/)
})

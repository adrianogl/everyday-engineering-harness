import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const STATUS = ['coberto', 'descartado']

function esperados() {
  return readFileSync('docs/triagem.tsv', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((linha) => linha.split('\t'))
    .filter(([origem, tipo]) => ['OMC', 'SP'].includes(origem) && ['skill', 'agent'].includes(tipo))
    .map(([origem, tipo, nome]) => ({ origem, tipo, nome }))
}

function linhas() {
  return readFileSync('docs/paridade.md', 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l) && !l.startsWith('| item atual'))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
    .map(([item, origem, equivalente, status]) => ({
      item: item.replace(/`/g, ''),
      origem,
      equivalente,
      status,
    }))
}

test('todo skill e agent do OMC e do superpowers aparece na tabela', () => {
  const tabela = linhas()
  const faltando = esperados().filter(
    (e) => !tabela.some((l) => l.origem === e.origem && l.item === e.nome),
  )
  assert.deepEqual(faltando, [])
})

test('a tabela não tem item fora da triagem nem duplicado', () => {
  const tabela = linhas()
  const chaves = tabela.map((l) => `${l.origem}:${l.item}`)
  assert.equal(new Set(chaves).size, chaves.length)
  const validas = new Set(esperados().map((e) => `${e.origem}:${e.nome}`))
  assert.deepEqual(chaves.filter((c) => !validas.has(c)), [])
})

test('status é um dos valores permitidos', () => {
  for (const l of linhas()) {
    assert.ok(STATUS.includes(l.status), `${l.origem} ${l.item}: status ${l.status}`)
  }
})

test('coberto aponta para arquivos que existem no repo', () => {
  for (const l of linhas().filter((x) => x.status === 'coberto')) {
    const caminhos = [...l.equivalente.matchAll(/`([^`]+)`/g)].map((m) => m[1])
    assert.ok(caminhos.length > 0, `${l.item}: coberto sem caminho`)
    for (const caminho of caminhos) {
      assert.ok(existsSync(caminho), `${l.item}: ${caminho} não existe`)
    }
  }
})

test('descartado traz o motivo', () => {
  for (const l of linhas().filter((x) => x.status === 'descartado')) {
    assert.ok(l.equivalente.length >= 10, `${l.item}: descartado sem motivo`)
  }
})

test('nenhuma linha plano-*', () => {
  assert.deepEqual(linhas().filter((l) => l.status.startsWith('plano-')).map((l) => l.item), [])
})

test('triagem.tsv é UTF-8 válido', () => {
  const bytes = readFileSync('docs/triagem.tsv')
  assert.doesNotThrow(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes))
})

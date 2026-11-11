import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadPerfil } from '../scripts/lib/perfil.mjs'

function tmp() {
  return mkdtempSync(join(tmpdir(), 'eeh-perfil-'))
}

function perfilValido(sobrescrever = {}) {
  return {
    versao: 1,
    atlassian: { mcp: 'atlassian', site: 'exemplo', cloudId: 'cloud-1', projeto: 'ABC', accountId: 'acc-1', transicaoConcluido: '' },
    confluence: { espaco: '', templateAdr: '' },
    figma: { mcp: 'figma' },
    repos: [],
    extensoes: [],
    denylist: [],
    ...sobrescrever
  }
}

function gravar(conteudo) {
  const path = join(tmp(), 'perfil.json')
  writeFileSync(path, typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo))
  return path
}

test('retorna faltando arquivo quando não existe', () => {
  const path = join(tmp(), 'nao-existe.json')
  const r = loadPerfil({ path, env: {} })
  assert.equal(r.perfil, null)
  assert.deepEqual(r.faltando, ['arquivo'])
})

test('usa EEH_PERFIL antes do caminho padrão', () => {
  const path = gravar(perfilValido())
  const r = loadPerfil({ env: { EEH_PERFIL: path } })
  assert.equal(r.origem, path)
  assert.deepEqual(r.faltando, [])
  assert.equal(r.perfil.atlassian.projeto, 'ABC')
})

test('aponta campos obrigatórios vazios', () => {
  const base = perfilValido()
  const path = gravar(perfilValido({ atlassian: { ...base.atlassian, site: '' } }))
  const r = loadPerfil({ path, env: {} })
  assert.ok(r.faltando.includes('atlassian.site'))
  assert.notEqual(r.perfil, null)
})

test('rejeita quando inválido', () => {
  const path = gravar(perfilValido({ extensoes: [{ skill: 'x', quando: 'depois' }] }))
  const r = loadPerfil({ path, env: {} })
  assert.ok(r.faltando.includes('extensoes[0].quando'))
})

test('aceita quando fim:<fase> e atalho', () => {
  const path = gravar(perfilValido({ extensoes: [{ skill: 'x', quando: 'fim:implementar' }, { skill: 'y', quando: 'atalho' }] }))
  assert.deepEqual(loadPerfil({ path, env: {} }).faltando, [])
})

test('rejeita stack desconhecida', () => {
  const path = gravar(perfilValido({ repos: [{ nome: 'a', caminho: '/a', stack: 'java' }] }))
  assert.ok(loadPerfil({ path, env: {} }).faltando.includes('repos[0].stack'))
})

test('não lança com JSON quebrado', () => {
  const path = gravar('{ quebrado')
  const r = loadPerfil({ path, env: {} })
  assert.deepEqual(r.faltando, ['json'])
  assert.equal(r.perfil, null)
})

test('perfil.example.json só tem os obrigatórios vazios', () => {
  const r = loadPerfil({ path: 'perfil.example.json', env: {} })
  assert.deepEqual(r.faltando, ['atlassian.site', 'atlassian.cloudId', 'atlassian.projeto', 'atlassian.accountId'])
})

test('perfil aceita registros opcional', () => {
  const sem = loadPerfil({ path: gravar(perfilValido()), env: {} })
  const com = loadPerfil({ path: gravar(perfilValido({ registros: '~/registros' })), env: {} })
  assert.deepEqual(com.faltando, sem.faltando)
  assert.equal(com.perfil.registros, '~/registros')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registrar, extrairChaves } from '../scripts/lib/registros.mjs'

const hook = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts/prompt-submit.mjs')

function ambiente() {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-ps-'))
  const perfil = join(dir, 'perfil.json')
  const base = join(dir, 'reg')
  writeFileSync(perfil, JSON.stringify({ registros: base }))
  return { dir, base, env: { ...process.env, EEH_PERFIL: perfil } }
}

function rodar(entrada, env) {
  return spawnSync('node', [hook], { input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada), env, encoding: 'utf8' })
}

test('chave no prompt com pasta injeta os registros', () => {
  const { dir, base, env } = ambiente()
  registrar({ base, chave: 'PROJ-7', tipo: 'decisao', texto: 'usar cache de 5 minutos', data: '2026-11-10' })
  const r = rodar({ prompt: 'continua a PROJ-7', cwd: dir }, env)
  assert.equal(r.status, 0)
  const saida = JSON.parse(r.stdout).hookSpecificOutput
  assert.equal(saida.hookEventName, 'UserPromptSubmit')
  assert.match(saida.additionalContext, /usar cache de 5 minutos/)
})

test('sem chave não há saída', () => {
  const { dir, env } = ambiente()
  const r = rodar({ prompt: 'explica o que é um handler', cwd: dir }, env)
  assert.equal(r.status, 0)
  assert.equal(r.stdout, '')
})

test('chave sem pasta não injeta nada', () => {
  const { dir, env } = ambiente()
  const r = rodar({ prompt: 'continua a PROJ-99', cwd: dir }, env)
  assert.equal(r.status, 0)
  assert.equal(r.stdout, '')
})

test('stdin malformado sai com 0 e sem saída', () => {
  const { env } = ambiente()
  for (const entrada of ['{ quebrado', '', 'null', '{"prompt": 3}']) {
    const r = rodar(entrada, env)
    assert.equal(r.status, 0, entrada)
    assert.equal(r.stdout, '', entrada)
  }
})

test('registros enormes são truncados em 10.000 caracteres', () => {
  const { dir, base, env } = ambiente()
  registrar({ base, chave: 'PROJ-8', tipo: 'nota', texto: 'x'.repeat(50000) })
  const r = rodar({ prompt: 'PROJ-8', cwd: dir }, env)
  const contexto = JSON.parse(r.stdout).hookSpecificOutput.additionalContext
  assert.ok(contexto.length <= 10000, `${contexto.length}`)
  assert.match(contexto, /truncados/)
})

test('extrai no máximo 3 chaves sem repetir', () => {
  assert.deepEqual(extrairChaves('PROJ-1 PROJ-1 AB-2 CD-3 EF-4'), ['PROJ-1', 'AB-2', 'CD-3'])
})

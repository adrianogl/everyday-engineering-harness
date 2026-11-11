import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildContext } from '../scripts/session-start.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const rulesDir = join(raiz, 'rules')

function perfilResult(sobrescrever = {}) {
  return {
    perfil: {
      versao: 1,
      atlassian: { mcp: 'atlassian', site: 'site-secreto', cloudId: 'cloud-secreto-99', projeto: 'ABC', accountId: 'conta-secreta-77' },
      repos: [{ nome: 'api', caminho: '/tmp/api', stack: 'go' }],
      extensoes: [],
      denylist: []
    },
    origem: '/tmp/perfil.json',
    faltando: [],
    ...sobrescrever
  }
}

test('inclui o orquestrador', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir })
  assert.match(contexto, /# Orquestrador do EEH/)
})

test('avisa perfil ausente sem lançar', () => {
  const contexto = buildContext({ perfilResult: { perfil: null, origem: '/x', faltando: ['arquivo'] }, rulesDir })
  assert.match(contexto, /Perfil do EEH não encontrado/)
})

test('lista extensões do perfil', () => {
  const base = perfilResult()
  base.perfil.extensoes = [{ skill: 'gmud', quando: 'fim:implementar' }]
  const contexto = buildContext({ perfilResult: base, rulesDir })
  assert.match(contexto, /gmud/)
  assert.match(contexto, /fim:implementar/)
})

test('não vaza campos do perfil', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir })
  assert.ok(!contexto.includes('cloud-secreto-99'))
  assert.ok(!contexto.includes('conta-secreta-77'))
})

test('não manda invocar skill sempre', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir })
  assert.doesNotMatch(contexto, /sempre (invoque|chame|use) (a |uma )?skill/i)
})

test('cabe no limite de contexto do hook e aponta as regras', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir })
  assert.ok(contexto.length < 10000, `contexto com ${contexto.length} caracteres`)
  for (const nome of ['text-pt-br.md', 'comments.md', 'code-review.md', 'git.md']) assert.ok(contexto.includes(join(rulesDir, nome)))
})

test('contexto informa a pasta de registros', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir, registros: '/tmp/ws/.eeh' })
  assert.match(contexto, /Pasta de registros: `\/tmp\/ws\/\.eeh`/)
})

test('contexto lista as entregas com registro', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir, registros: '/tmp/ws/.eeh', entregas: ['PROJ-7-frete'] })
  assert.match(contexto, /Entregas com registro: PROJ-7-frete\./)
})

test('lista enorme de entregas continua abaixo de 10.000 caracteres', () => {
  const entregas = Array.from({ length: 30 }, (_, i) => `PROJ-${1000 + i}-${'slug-muito-longo-'.repeat(20)}`)
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir, registros: `/tmp/${'pasta/'.repeat(10)}.eeh`, entregas })
  assert.ok(contexto.length < 10000, `contexto com ${contexto.length} caracteres`)
  assert.match(contexto, /\+\d+\./)
})

test('traz o resumo das quatro regras', () => {
  const contexto = buildContext({ perfilResult: perfilResult(), rulesDir })
  for (const titulo of ['## Texto em PT-BR', '## Comentários de código', '## Code review', '## Git']) assert.ok(contexto.includes(titulo), titulo)
})

test('CLI sai com 0 e JSON válido com módulo de perfil quebrado', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-ss-mod-'))
  cpSync(join(raiz, 'scripts'), join(dir, 'scripts'), { recursive: true })
  cpSync(rulesDir, join(dir, 'rules'), { recursive: true })
  writeFileSync(join(dir, 'scripts/lib/perfil.mjs'), 'export const quebrado = ;')
  const saida = execFileSync('node', [join(dir, 'scripts/session-start.mjs')], { encoding: 'utf8' })
  assert.equal(JSON.parse(saida).hookSpecificOutput.hookEventName, 'SessionStart')
})

test('CLI sai com 0 com perfil quebrado', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-ss-'))
  const path = join(dir, 'perfil.json')
  writeFileSync(path, '{ quebrado')
  const saida = execFileSync('node', [join(raiz, 'scripts/session-start.mjs')], {
    env: { ...process.env, EEH_PERFIL: path },
    encoding: 'utf8'
  })
  const json = JSON.parse(saida)
  assert.equal(json.hookSpecificOutput.hookEventName, 'SessionStart')
  assert.equal(typeof json.hookSpecificOutput.additionalContext, 'string')
})

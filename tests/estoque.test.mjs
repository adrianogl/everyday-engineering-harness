import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { referencias, semUso } from '../scripts/lib/estoque.mjs'

function montar(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'eeh-estoque-'))
  for (const [caminho, texto] of Object.entries(arquivos)) {
    const alvo = join(raiz, caminho)
    mkdirSync(dirname(alvo), { recursive: true })
    writeFileSync(alvo, texto)
  }
  return raiz
}

test('referencias acha citação em command e em agent', () => {
  const raiz = montar({
    'skills/frete/SKILL.md': '# Frete\n',
    'agents/auditor.md': 'Siga a skill `frete`.\n',
    'commands/cotar.md': 'Rode frete antes.\n',
  })
  const r = referencias({ raiz })
  assert.deepEqual(r.frete.sort(), ['agents/auditor.md', 'commands/cotar.md'])
})

test('referencias não conta o próprio arquivo', () => {
  const raiz = montar({
    'skills/frete/SKILL.md': 'frete frete `frete`\n',
    'skills/frete/apoio.md': 'frete de novo\n',
  })
  assert.deepEqual(referencias({ raiz }).frete, [])
})

test('referencias usa palavra inteira, sem confundir nomes parecidos', () => {
  const raiz = montar({
    'agents/review.md': '# review\n',
    'agents/reviewer-go.md': 'veja reviewer-go e pre-review\n',
    'rules/geral.md': 'use o reviewer-go\n',
  })
  const r = referencias({ raiz })
  assert.deepEqual(r.review, [])
})

test('referencias lê rules e skills', () => {
  const raiz = montar({
    'agents/seguro.md': '# seguro\n',
    'skills/cotar/SKILL.md': 'Chame `seguro`.\n',
    'rules/x.md': 'cotar sempre\n',
  })
  const r = referencias({ raiz })
  assert.deepEqual(r.seguro, ['skills/cotar/SKILL.md'])
  assert.deepEqual(r.cotar, ['rules/x.md'])
})

test('semUso lista skill que ninguém cita', () => {
  const raiz = montar({
    'skills/orfa/SKILL.md': '# orfa\n',
    'skills/usada/SKILL.md': '# usada\n',
    'commands/c.md': 'chama usada\n',
  })
  assert.deepEqual(semUso({ raiz }), ['orfa'])
})

test('CLI imprime semUso e contagem por peça', () => {
  const raiz = montar({
    'skills/orfa/SKILL.md': '# orfa\n',
    'skills/usada/SKILL.md': '# usada\n',
    'commands/c.md': 'chama usada\n',
  })
  const r = spawnSync('node', ['scripts/estoque.mjs', '--raiz', raiz], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /sem uso/i)
  assert.match(r.stdout, /orfa/)
  assert.match(r.stdout, /usada\s+1/)
})

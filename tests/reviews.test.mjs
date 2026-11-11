import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pastaReview, registrarItem, atualizarItem, registrarRodada, lerHistorico, reviewsDoPrompt } from '../scripts/lib/reviews.mjs'

function tmp() {
  return mkdtempSync(join(tmpdir(), 'eeh-rev-'))
}

function novoItem(pasta, texto = 'parser ignora erro') {
  return registrarItem({ pasta, arquivo: 'internal/frete/parser.go', linha: 42, tipo: 'bloqueante', texto })
}

test('pastaReview com e sem chave', () => {
  const base = tmp()
  assert.equal(pastaReview({ base, repo: 'frete-api', numero: 42 }), join(base, '_reviews', 'frete-api-42'))
  mkdirSync(join(base, 'FRT-1-cotacao'))
  assert.equal(pastaReview({ base, repo: 'frete-api', numero: 42, chave: 'FRT-1' }), join(base, 'FRT-1-cotacao', 'reviews', 'frete-api-42'))
})

test('pastaReview rejeita repo com barra, ponto inicial e numero 0', () => {
  const base = tmp()
  assert.throws(() => pastaReview({ base, repo: 'a/b', numero: 1 }), /repo/)
  assert.throws(() => pastaReview({ base, repo: '.oculto', numero: 1 }), /repo/)
  assert.throws(() => pastaReview({ base, repo: 'frete-api', numero: 0 }), /numero/)
})

test('registrarItem numera C-1, C-2', () => {
  const pasta = join(tmp(), 'r')
  assert.equal(novoItem(pasta), 'C-1')
  assert.equal(novoItem(pasta, 'outro'), 'C-2')
  const linhas = readFileSync(join(pasta, 'comentarios.md'), 'utf8').trim().split('\n')
  assert.equal(linhas[0], '- C-1 [bloqueante] [aberto] internal/frete/parser.go:42 — parser ignora erro')
  assert.equal(linhas.length, 2)
})

test('atualizarItem descartado exige motivo', () => {
  const pasta = join(tmp(), 'r')
  novoItem(pasta)
  novoItem(pasta, 'outro')
  assert.throws(() => atualizarItem({ pasta, id: 'C-1', status: 'descartado' }), /motivo/)
  atualizarItem({ pasta, id: 'C-1', status: 'descartado', motivo: 'já tratado no caller' })
  atualizarItem({ pasta, id: 'C-2', status: 'resolvido' })
  const linhas = readFileSync(join(pasta, 'comentarios.md'), 'utf8').trim().split('\n')
  assert.equal(linhas[0], '- C-1 [bloqueante] [descartado] internal/frete/parser.go:42 — parser ignora erro (motivo: já tratado no caller)')
  assert.equal(linhas[1], '- C-2 [bloqueante] [resolvido] internal/frete/parser.go:42 — outro')
})

test('atualizarItem id inexistente lança', () => {
  const pasta = join(tmp(), 'r')
  novoItem(pasta)
  assert.throws(() => atualizarItem({ pasta, id: 'C-9', status: 'resolvido' }), /C-9/)
})

test('lerHistorico de pasta inexistente', () => {
  assert.deepEqual(lerHistorico(join(tmp(), 'nada')), { itens: [], rodadas: [] })
})

test('lerHistorico devolve itens e rodadas', () => {
  const pasta = join(tmp(), 'r')
  novoItem(pasta)
  atualizarItem({ pasta, id: 'C-1', status: 'descartado', motivo: 'ok' })
  registrarRodada({ pasta, commit: 'abc1234', resultado: 'PEDIR MUDANÇAS', data: '2026-11-11' })
  const { itens, rodadas } = lerHistorico(pasta)
  assert.deepEqual(itens[0], { id: 'C-1', tipo: 'bloqueante', status: 'descartado', arquivo: 'internal/frete/parser.go', linha: 42, texto: 'parser ignora erro', motivo: 'ok' })
  assert.deepEqual(rodadas, [{ data: '2026-11-11', commit: 'abc1234', resultado: 'PEDIR MUDANÇAS' }])
})

test('reviewsDoPrompt casa frete-api#42 e URL de PR', () => {
  const base = tmp()
  novoItem(pastaReview({ base, repo: 'frete-api', numero: 42 }), 'item da 42')
  novoItem(pastaReview({ base, repo: 'seguro-api', numero: 7, chave: 'FRT-1' }), 'item da 7')
  const a = reviewsDoPrompt('olha frete-api#42', { base })
  assert.match(a, /item da 42/)
  assert.match(a, /frete-api#42/)
  const b = reviewsDoPrompt('https://github.com/acme/seguro-api/pull/7 de novo', { base })
  assert.match(b, /item da 7/)
  assert.equal(reviewsDoPrompt('frete-api#43', { base }), '')
})

test('reviewsDoPrompt ignora "revisa a 42"', () => {
  const base = tmp()
  novoItem(pastaReview({ base, repo: 'frete-api', numero: 42 }))
  assert.equal(reviewsDoPrompt('revisa a 42', { base }), '')
  assert.equal(reviewsDoPrompt('revisa a #42', { base }), '')
})

test('reviewsDoPrompt respeita 2 PRs e 4000 caracteres', () => {
  const base = tmp()
  for (const n of [1, 2, 3]) novoItem(pastaReview({ base, repo: 'frete-api', numero: n }), `item-pr-${n}`)
  const tres = reviewsDoPrompt('frete-api#1 frete-api#2 frete-api#3', { base })
  assert.match(tres, /item-pr-1/)
  assert.match(tres, /item-pr-2/)
  assert.doesNotMatch(tres, /item-pr-3/)
  const pasta = pastaReview({ base, repo: 'frete-api', numero: 9 })
  novoItem(pasta, 'x'.repeat(9000))
  const longo = reviewsDoPrompt('frete-api#9', { base })
  assert.ok(longo.length <= 4000, `${longo.length}`)
})

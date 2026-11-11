import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { montarCard } from '../scripts/lib/card.mjs'

const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'card.mjs')

function recorteBack(extra = {}) {
  return {
    repo: 'frete-api',
    titulo: 'Cotação de frete por CEP',
    aceite: ['retorna 200 com o valor do frete', 'retorna 422 para CEP inválido'],
    adr: { link: 'https://exemplo.dev/adr/0007', secao: 'Cotação por CEP' },
    recorteAdr: 'O endpoint POST /cotacoes calcula o frete por CEP de origem e destino.',
    contrato: { resumo: 'POST /cotacoes recebe cepOrigem e cepDestino.', completo: '# Contrato\n\nPOST /cotacoes' },
    sql: {
      script: 'ALTER TABLE cotacao ADD COLUMN prazo_dias int;',
      banco: 'frete',
      ambiente: 'qa',
      ordem: 'antes',
      rollback: 'ALTER TABLE cotacao DROP COLUMN prazo_dias;',
    },
    ...extra,
  }
}

test('card de back com contrato e sql gera três anexos', () => {
  const card = montarCard(recorteBack())
  assert.deepEqual(card.anexos.map((a) => a.nome), ['frete-api.sql', 'frete-api-rollback.sql', 'frete-api-contrato.md'])
  assert.equal(card.anexos[0].conteudo, 'ALTER TABLE cotacao ADD COLUMN prazo_dias int;')
  assert.equal(card.anexos[1].conteudo, 'ALTER TABLE cotacao DROP COLUMN prazo_dias;')
  assert.equal(card.anexos[2].conteudo, '# Contrato\n\nPOST /cotacoes')
  assert.equal(card.comentario, 'Recorte da ADR (Cotação por CEP)\n\nO endpoint POST /cotacoes calcula o frete por CEP de origem e destino.')
  assert.match(card.descricao, /rollback: anexo frete-api-rollback\.sql/)
  assert.match(card.descricao, /frete-api\.sql/)
})

test('card de front sem sql não gera anexo sql nem seção SQL', () => {
  const card = montarCard({
    repo: 'frete-web',
    titulo: 'Tela de cotação',
    aceite: ['mostra o valor do frete'],
    adr: { link: 'https://exemplo.dev/adr/0007', secao: 'Tela' },
    recorteAdr: 'A tela consome POST /cotacoes.',
    figma: { link: 'https://exemplo.dev/figma/abc', estados: ['carregando', 'erro'], copy: ['Calcular frete'] },
  })
  assert.deepEqual(card.anexos, [])
  assert.doesNotMatch(card.descricao, /SQL manual/)
  assert.doesNotMatch(card.descricao, /## Contrato/)
  assert.match(card.descricao, /## Figma/)
  assert.match(card.descricao, /carregando/)
  assert.match(card.descricao, /Calcular frete/)
})

test('sql sem banco lança com o nome do campo', () => {
  const recorte = recorteBack()
  delete recorte.sql.banco
  assert.throws(() => montarCard(recorte), /sql\.banco/)
})

test('lança listando todos os campos faltando numa mensagem só', () => {
  const recorte = recorteBack({ aceite: [], recorteAdr: '' })
  delete recorte.sql.ambiente
  assert.throws(
    () => montarCard(recorte),
    (e) => /aceite/.test(e.message) && /recorteAdr/.test(e.message) && /sql\.ambiente/.test(e.message),
  )
})

test('ordem inválida lança', () => {
  assert.throws(() => montarCard(recorteBack({ sql: { script: 'x', banco: 'frete', ambiente: 'qa', ordem: 'durante' } })), /ordem/)
})

test('aceite vazio lança', () => {
  assert.throws(() => montarCard(recorteBack({ aceite: [] })), /aceite/)
})

test('repo que escapa da pasta de saída lança', () => {
  assert.throws(() => montarCard(recorteBack({ repo: '../x' })), /repo/)
  assert.throws(() => montarCard(recorteBack({ repo: '.oculto' })), /repo/)
})

test('descrição segue a ordem das seções', () => {
  const card = montarCard(recorteBack({ figma: { link: 'https://exemplo.dev/figma/abc' } }))
  const posicoes = ['## Contrato', '## SQL manual', '## Critério de aceite', '## Figma', '## ADR'].map((s) => card.descricao.indexOf(s))
  assert.ok(posicoes.every((p) => p >= 0))
  assert.deepEqual([...posicoes].sort((a, b) => a - b), posicoes)
  assert.match(card.descricao, /1\. retorna 200 com o valor do frete\n2\. retorna 422/)
})

test('ordem depois escreve "depois do deploy"', () => {
  const card = montarCard(recorteBack({ sql: { script: 'x', banco: 'frete', ambiente: 'qa', ordem: 'depois' } }))
  assert.match(card.descricao, /depois do deploy/)
  assert.doesNotMatch(card.descricao, /antes do deploy/)
  assert.match(card.descricao, /sem rollback/)
  assert.deepEqual(card.anexos.map((a) => a.nome), ['frete-api.sql', 'frete-api-contrato.md'])
})

test('CLI grava os arquivos na pasta de saída', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-card-'))
  const arquivo = join(dir, 'recorte.json')
  const saida = join(dir, 'saida')
  writeFileSync(arquivo, JSON.stringify(recorteBack()))
  const r = spawnSync('node', [cli, 'montar', arquivo, saida], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(readdirSync(saida).sort(), ['comentario.md', 'descricao.md', 'frete-api-contrato.md', 'frete-api-rollback.sql', 'frete-api.sql'])
  assert.match(readFileSync(join(saida, 'descricao.md'), 'utf8'), /## SQL manual/)
  assert.match(readFileSync(join(saida, 'comentario.md'), 'utf8'), /^Recorte da ADR \(Cotação por CEP\)/)
})

test('CLI com recorte inválido sai com 1 e escreve no stderr', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-card-'))
  const arquivo = join(dir, 'recorte.json')
  writeFileSync(arquivo, JSON.stringify(recorteBack({ aceite: [] })))
  const r = spawnSync('node', [cli, 'montar', arquivo, join(dir, 'saida')], { encoding: 'utf8' })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /aceite/)
})

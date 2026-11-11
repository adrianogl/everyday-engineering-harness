import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { lerPecas, linhaCurta, montarCatalogo, blocoReadme, conferir, LIMITE_LINHA } from '../scripts/lib/catalogo.mjs'

function repoFalso() {
  const raiz = mkdtempSync(join(tmpdir(), 'eeh-catalogo-'))
  mkdirSync(join(raiz, 'commands'))
  mkdirSync(join(raiz, 'agents'))
  mkdirSync(join(raiz, 'skills', 'zeta'), { recursive: true })
  writeFileSync(join(raiz, 'commands', 'ola.md'), '---\ndescription: Diz olá. Para antes de tudo.\n---\n# x\n')
  writeFileSync(join(raiz, 'agents', 'bia.md'), '---\nname: bia\ndescription: "Faz a coisa. Use quando precisar."\nmodel: haiku\n---\n# x\n')
  writeFileSync(join(raiz, 'skills', 'zeta', 'SKILL.md'), '---\nname: zeta\ndescription: Faz zeta; Use com cuidado.\n---\n# x\n')
  return raiz
}

test('lerPecas acha 7 commands, 24 skills e 35 agents no repo', () => {
  const pecas = lerPecas({ raiz: '.' })
  const por = (tipo) => pecas.filter((p) => p.tipo === tipo).length
  assert.deepEqual([por('command'), por('skill'), por('agent')], [7, 24, 35])
  assert.ok(pecas.every((p) => p.descricao.length > 0))
})

test('lerPecas lê description com e sem aspas', () => {
  const pecas = lerPecas({ raiz: repoFalso() })
  assert.deepEqual(pecas, [
    { tipo: 'agent', nome: 'bia', descricao: 'Faz a coisa. Use quando precisar.' },
    { tipo: 'command', nome: 'ola', descricao: 'Diz olá. Para antes de tudo.' },
    { tipo: 'skill', nome: 'zeta', descricao: 'Faz zeta; Use com cuidado.' },
  ])
})

test('linhaCurta corta antes de Use', () => {
  assert.equal(linhaCurta('Faz a coisa. Use quando precisar.'), 'Faz a coisa.')
  assert.equal(linhaCurta('Faz zeta; Use com cuidado.'), 'Faz zeta;')
  assert.equal(linhaCurta('Sem ponto final'), 'Sem ponto final.')
  assert.equal(linhaCurta('Uma frase.'), 'Uma frase.')
  assert.equal(linhaCurta('Faz X Use quando Y.'), 'Faz X.')
})

test('linhaCurta não trata e.g., i.e. e ex. como fim de frase', () => {
  assert.equal(linhaCurta('Faz X (e.g. Y) e Z. Outra.'), 'Faz X (e.g. Y) e Z.')
  assert.equal(linhaCurta('Faz X, i.e. Y, e Z. Outra.'), 'Faz X, i.e. Y, e Z.')
  assert.equal(linhaCurta('Faz X, ex. Y, e Z. Outra.'), 'Faz X, ex. Y, e Z.')
})

test('montarCatalogo lança com peça sem tradução', () => {
  const raiz = repoFalso()
  assert.throws(() => montarCatalogo({ raiz, en: { 'agent/bia': 'x', 'command/ola': 'y' } }), /skill\/zeta/)
})

test('montarCatalogo lança com tradução sem peça', () => {
  const raiz = repoFalso()
  const en = { 'agent/bia': 'x', 'command/ola': 'y', 'skill/zeta': 'z', 'skill/fantasma': 'w' }
  assert.throws(() => montarCatalogo({ raiz, en }), /skill\/fantasma/)
})

test('montarCatalogo devolve contagem e peças com pt e en', () => {
  const raiz = repoFalso()
  const en = { 'agent/bia': 'A.', 'command/ola': 'B.', 'skill/zeta': 'C.' }
  const catalogo = montarCatalogo({ raiz, en })
  assert.deepEqual(catalogo.contagem, { command: 1, skill: 1, agent: 1 })
  assert.deepEqual(catalogo.pecas[0], { tipo: 'agent', nome: 'bia', pt: 'Faz a coisa.', en: 'A.' })
})

test('blocoReadme tem os marcadores e uma linha por peça', () => {
  const raiz = repoFalso()
  const en = { 'agent/bia': 'A.', 'command/ola': 'B.', 'skill/zeta': 'C.' }
  const catalogo = montarCatalogo({ raiz, en })
  for (const idioma of ['en', 'pt']) {
    const bloco = blocoReadme(catalogo, idioma)
    assert.ok(bloco.startsWith('<!-- catalogo:inicio -->'))
    assert.ok(bloco.endsWith('<!-- catalogo:fim -->'))
    assert.equal(bloco.split('\n').filter((l) => /^\| `/.test(l)).length, 3)
  }
  assert.match(blocoReadme(catalogo, 'en'), /\| `\/eeh:ola` \| B\. \|/)
  assert.match(blocoReadme(catalogo, 'pt'), /\| `bia` \| Faz a coisa\. \|/)
})

test('montarCatalogo usa a linha em pt quando existe e rejeita pt sem peça', () => {
  const raiz = repoFalso()
  const en = { 'agent/bia': 'A.', 'command/ola': 'B.', 'skill/zeta': 'C.' }
  const catalogo = montarCatalogo({ raiz, en, pt: { 'agent/bia': 'Curta.' } })
  assert.equal(catalogo.pecas[0].pt, 'Curta.')
  assert.throws(() => montarCatalogo({ raiz, en, pt: { 'agent/nada': 'x' } }), /agent\/nada/)
})

test('linha pt acima de 120 caracteres exige override em catalogo.pt.json', () => {
  const pt = JSON.parse(readFileSync('site/catalogo.pt.json', 'utf8'))
  const chaves = new Set(lerPecas({ raiz: '.' }).map((p) => `${p.tipo}/${p.nome}`))
  for (const [chave, linha] of Object.entries(pt)) {
    assert.ok(chaves.has(chave), `override sem peça: ${chave}`)
    assert.ok(linha.length <= LIMITE_LINHA, `override longo (${linha.length}): ${chave}`)
  }
  const en = JSON.parse(readFileSync('site/catalogo.en.json', 'utf8'))
  const longas = montarCatalogo({ raiz: '.', en, pt }).pecas.filter((p) => p.pt.length > LIMITE_LINHA)
  assert.deepEqual(longas.map((p) => `${p.tipo}/${p.nome}`), [])
})

test('site/catalogo.json está em dia', () => {
  const diferencas = conferir({ raiz: '.' })
  assert.deepEqual(diferencas, [], `Diferenças:\n${diferencas.join('\n')}\nRode: node scripts/catalogo.mjs gerar`)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const raiz = 'skills'
const pastas = readdirSync(raiz, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
const upstream = JSON.parse(readFileSync('upstream.json', 'utf8'))

function ler(pasta) {
  return readFileSync(join(raiz, pasta, 'SKILL.md'), 'utf8')
}

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/)
  assert.ok(m, 'SKILL.md sem frontmatter')
  const campos = {}
  let bloco = null
  for (const linha of m[1].split('\n')) {
    const filho = linha.match(/^\s+(\w+):\s*(.*)$/)
    if (filho && bloco) {
      campos[bloco][filho[1]] = filho[2]
      continue
    }
    const topo = linha.match(/^(\w+):\s*(.*)$/)
    if (!topo) continue
    if (topo[2] === '') {
      bloco = topo[1]
      campos[bloco] = {}
    } else {
      bloco = null
      campos[topo[1]] = topo[2]
    }
  }
  return campos
}

function origem(pasta) {
  return frontmatter(ler(pasta)).metadata?.origin ?? 'eeh'
}

test('toda skill tem name igual à pasta e description', () => {
  assert.ok(pastas.length > 0)
  for (const pasta of pastas) {
    const fm = frontmatter(ler(pasta))
    assert.equal(fm.name, pasta, `${pasta}: name diferente da pasta`)
    assert.ok(fm.description && fm.description.length > 20, `${pasta}: sem description`)
  }
})

test('toda skill derivada tem metadata.origin e entrada em upstream.json', () => {
  const pecas = new Set(upstream.pecas.map((p) => p.peca).filter((p) => p.startsWith(`${raiz}/`)))
  for (const pasta of pastas) {
    const o = origem(pasta)
    if (o === 'eeh') continue
    assert.ok(pecas.has(`${raiz}/${pasta}`), `${pasta}: origin ${o} sem peça em upstream.json`)
  }
  for (const peca of pecas) {
    assert.ok(pastas.includes(peca.replace(`${raiz}/`, '')), `${peca}: peça sem skill`)
  }
})

test('nenhuma skill manda invocar skill sempre', () => {
  for (const pasta of pastas) {
    assert.doesNotMatch(ler(pasta), /MUST (use|invoke)|ABSOLUTELY MUST|1% chance/i, pasta)
  }
})

test('commit registrado existe', () => {
  for (const peca of upstream.pecas) {
    assert.ok(peca.origens.length > 0, `${peca.peca}: sem origens`)
    for (const o of peca.origens) {
      assert.ok(upstream.fontes[o.fonte], `${peca.peca}: fonte ${o.fonte} desconhecida`)
      assert.ok(o.caminho, `${peca.peca}: origem sem caminho`)
      const temCommit = typeof o.commit === 'string' && /^[0-9a-f]{40}$/.test(o.commit)
      const temVersao = typeof o.versao === 'string' && /^\d+\.\d+\.\d+$/.test(o.versao)
      assert.ok(temCommit || temVersao, `${peca.peca}: ${o.caminho} sem commit de 40 hex nem versão`)
    }
  }
})

test('skill derivada diz quando usar e quando não usar', () => {
  for (const pasta of pastas) {
    if (origem(pasta) === 'eeh') continue
    const { description } = frontmatter(ler(pasta))
    assert.match(description, /Use /, `${pasta}: description sem "Use"`)
    assert.match(description, /Não use/, `${pasta}: description sem "Não use"`)
  }
})

test('skill não carrega estado nem infra de upstream', () => {
  for (const pasta of pastas) {
    assert.doesNotMatch(ler(pasta), /\.omc\/|session-data|oh-my-claudecode|state_write|notepad_/, pasta)
  }
})

test('skill fica abaixo de 250 linhas', () => {
  for (const pasta of pastas) {
    const linhas = ler(pasta).split('\n').length
    assert.ok(linhas <= 250, `${pasta}: ${linhas} linhas`)
  }
})

test('arquivos de upstream existem como skills', () => {
  for (const pasta of pastas) {
    assert.ok(existsSync(join(raiz, pasta, 'SKILL.md')))
  }
})

test('skills das fases de entrega existem', () => {
  for (const pasta of ['adr', 'adr-revisar', 'quebrar', 'qa']) {
    assert.ok(pastas.includes(pasta), `${pasta}: skill ausente`)
    const { description } = frontmatter(ler(pasta))
    assert.match(description, /Use /, `${pasta}: description sem "Use"`)
    assert.match(description, /Não use/, `${pasta}: description sem "Não use"`)
  }
})

test('adr cita Sem template de ADR configurado ou acessível', () => {
  assert.match(ler('adr'), /Sem template de ADR configurado ou acessível/)
})

test('adr-revisar cita inline, rodapé e conteudo-externo', () => {
  const texto = ler('adr-revisar')
  assert.match(texto, /inline/)
  assert.match(texto, /rodapé/)
  assert.match(texto, /conteudo-externo/)
})

test('quebrar cita conferente, card.mjs e um card por repo', () => {
  const texto = ler('quebrar')
  assert.match(texto, /conferente/)
  assert.match(texto, /card\.mjs/)
  assert.match(texto, /um card por repo/i)
})

test('qa cita qa-pos-deploy e fim:qa', () => {
  const texto = ler('qa')
  assert.match(texto, /qa-pos-deploy/)
  assert.match(texto, /fim:qa/)
})

test('review mantém as regras e cita reviews.mjs', () => {
  const texto = ler('review')
  assert.match(texto, /só o que a PR introduziu/)
  assert.match(texto, /dois revisores/)
  assert.match(texto, /rules\/code-review\.md/)
  assert.match(texto, /reviews\.mjs/)
})

test('skills das fases têm as paradas com rótulo exato', () => {
  const esperado = {
    adr: ['Parada 1: dúvidas', 'Parada 2: publicar'],
    'adr-revisar': ['Parada 1: atualizar a página'],
    quebrar: ['Parada 1: conflitos', 'Parada 2: criar cards'],
    qa: ['Parada 1: mover ou comentar o card'],
  }
  for (const [pasta, rotulos] of Object.entries(esperado)) {
    for (const rotulo of rotulos) assert.ok(ler(pasta).includes(rotulo), `${pasta}: sem "${rotulo}"`)
  }
})

test('skills de manutenção existem com as paradas de rótulo exato', () => {
  const esperado = {
    'manutencao-pacote': 'Parada 1: criar ou alterar a peça',
    deepinit: 'Parada 1: gravar os AGENTS.md',
  }
  for (const [pasta, rotulo] of Object.entries(esperado)) {
    assert.ok(pastas.includes(pasta), `${pasta}: skill ausente`)
    assert.ok(ler(pasta).includes(rotulo), `${pasta}: sem "${rotulo}"`)
    assert.notEqual(origem(pasta), 'eeh', `${pasta}: sem metadata.origin`)
  }
})

test('manutencao-pacote cita estoque.mjs, upstream.json e skill local', () => {
  const texto = ler('manutencao-pacote')
  assert.match(texto, /estoque\.mjs/)
  assert.match(texto, /upstream\.json/)
  assert.match(texto, /skill local/)
  assert.match(texto, /extensoes/)
})

test('deepinit exige repo:caminho:linha ou não verificado', () => {
  const texto = ler('deepinit')
  assert.match(texto, /repo:caminho:linha/)
  assert.match(texto, /não verificado/)
})

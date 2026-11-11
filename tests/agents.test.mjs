import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const raiz = 'agents'
const arquivos = existsSync(raiz) ? readdirSync(raiz).filter((f) => f.endsWith('.md')) : []
const upstream = JSON.parse(readFileSync('upstream.json', 'utf8'))

const esperados = [
  'explorar', 'architect', 'planner', 'critic', 'implementador-go', 'implementador-react',
  'test-engineer', 'code-reviewer', 'reviewer-go', 'reviewer-react', 'reviewer-typescript',
  'reviewer-database', 'silent-failure-hunter', 'type-design-analyzer', 'security-reviewer',
  'verifier', 'debugger', 'tracer', 'build-fix-go', 'build-fix-react', 'document-specialist',
  'redator-ptbr', 'git', 'front-visual',
  'analista-epico', 'redator-adr', 'revisor-adr', 'leitor-comentarios', 'extrator-contrato',
  'extrator-sql', 'redator-aceite', 'recortador-figma', 'conferente', 'redator-card',
]

const proprios = [
  'analista-epico', 'redator-adr', 'revisor-adr', 'leitor-comentarios', 'extrator-contrato',
  'extrator-sql', 'redator-aceite', 'recortador-figma', 'conferente', 'redator-card',
]

const somenteLeitura = [
  'explorar', 'architect', 'critic', 'code-reviewer', 'reviewer-go', 'reviewer-react',
  'reviewer-typescript', 'reviewer-database', 'silent-failure-hunter', 'type-design-analyzer',
  'security-reviewer', 'verifier',
  'analista-epico', 'revisor-adr', 'leitor-comentarios', 'extrator-contrato', 'extrator-sql',
  'redator-aceite', 'recortador-figma', 'conferente',
]

const modelos = {
  haiku: ['explorar', 'document-specialist', 'extrator-contrato', 'extrator-sql', 'recortador-figma'],
  sonnet: ['implementador-go', 'implementador-react', 'test-engineer', 'build-fix-go', 'build-fix-react', 'redator-ptbr', 'git', 'front-visual', 'redator-adr', 'leitor-comentarios', 'redator-aceite', 'redator-card'],
  opus: ['architect', 'planner', 'critic', 'code-reviewer', 'reviewer-go', 'reviewer-react', 'reviewer-typescript', 'reviewer-database', 'silent-failure-hunter', 'type-design-analyzer', 'security-reviewer', 'verifier', 'debugger', 'tracer', 'analista-epico', 'revisor-adr', 'conferente'],
}

const bloco = 'DÚVIDA\nPergunta: <uma frase>\nContexto: <o que foi visto>\nOpções: <a) ... b) ...>\nRecomendação: <opção e motivo>'

function ler(arquivo) {
  return readFileSync(join(raiz, arquivo), 'utf8')
}

function frontmatter(texto) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/)
  assert.ok(m, 'agent sem frontmatter')
  const campos = {}
  for (const linha of m[1].split('\n')) {
    const campo = linha.match(/^(\w+):\s*(.*)$/)
    if (campo) campos[campo[1]] = campo[2].replace(/^"(.*)"$/, '$1')
  }
  return campos
}

test('existem os 34 agents esperados', () => {
  assert.deepEqual(arquivos.map((f) => f.replace(/\.md$/, '')).sort(), [...esperados].sort())
})

test('todo agent tem name igual ao arquivo, description, model válido e tools', () => {
  assert.ok(arquivos.length > 0)
  for (const arquivo of arquivos) {
    const fm = frontmatter(ler(arquivo))
    assert.equal(fm.name, arquivo.replace(/\.md$/, ''), `${arquivo}: name diferente do arquivo`)
    assert.ok(fm.description && fm.description.length > 40, `${arquivo}: sem description`)
    assert.match(fm.description, /Use /, `${arquivo}: description sem "Use"`)
    assert.match(fm.description, /Não use/, `${arquivo}: description sem "Não use"`)
    assert.ok(['haiku', 'sonnet', 'opus'].includes(fm.model), `${arquivo}: model ${fm.model} inválido`)
    assert.ok(fm.tools && fm.tools.length > 0, `${arquivo}: sem tools`)
  }
})

test('cada agent roda no modelo definido no design', () => {
  for (const [modelo, nomes] of Object.entries(modelos)) {
    for (const nome of nomes) {
      assert.equal(frontmatter(ler(`${nome}.md`)).model, modelo, `${nome}: esperado ${modelo}`)
    }
  }
  const cobertos = Object.values(modelos).flat().sort()
  assert.deepEqual(cobertos, [...esperados].sort())
})

test('todo agent tem a seção de dúvida com o bloco DÚVIDA', () => {
  for (const arquivo of arquivos) {
    const texto = ler(arquivo)
    assert.match(texto, /^## Quando tiver dúvida$/m, `${arquivo}: sem seção de dúvida`)
    assert.ok(texto.includes(bloco), `${arquivo}: sem o bloco DÚVIDA exato`)
    assert.equal(texto.split('\n## ').pop().startsWith('Quando tiver dúvida'), true, `${arquivo}: a seção de dúvida não é a última`)
  }
})

test('agents só de leitura não têm Edit, Write nem Bash', () => {
  for (const nome of somenteLeitura.filter((n) => n !== 'verifier')) {
    const { tools } = frontmatter(ler(`${nome}.md`))
    const lista = tools.split(',').map((t) => t.trim())
    for (const proibida of ['Edit', 'Write', 'Bash']) {
      assert.ok(!lista.includes(proibida), `${nome}: tem ${proibida}`)
    }
  }
})

test('verifier tem Bash sem Edit nem Write e proíbe operação de escrita', () => {
  const texto = ler('verifier.md')
  const lista = frontmatter(texto).tools.split(',').map((t) => t.trim())
  assert.ok(lista.includes('Bash'))
  assert.ok(!lista.includes('Edit') && !lista.includes('Write'))
  for (const termo of ['git commit', 'git push', 'git merge', 'git rebase', 'gh', 'arquivo por shell']) {
    assert.ok(texto.includes(termo), `verifier: proibição sem "${termo}"`)
  }
})

test('todo agent referencia a regra de conteúdo externo', () => {
  assert.ok(existsSync('rules/conteudo-externo.md'))
  for (const arquivo of arquivos) {
    assert.ok(ler(arquivo).includes('${CLAUDE_PLUGIN_ROOT}/rules/conteudo-externo.md'), `${arquivo}: sem referência`)
  }
})

test('agents de escrita de documento têm Write e os de leitura não', () => {
  const lista = (nome) => frontmatter(ler(`${nome}.md`)).tools.split(',').map((t) => t.trim())
  assert.deepEqual(lista('redator-adr'), ['Read', 'Write', 'Edit'])
  assert.deepEqual(lista('redator-card'), ['Read', 'Write'])
  for (const nome of proprios.filter((n) => !['redator-adr', 'redator-card'].includes(n))) {
    assert.deepEqual(lista(nome), ['Read', 'Grep', 'Glob'], nome)
  }
})

test('agents que escrevem código têm Edit e Write', () => {
  for (const nome of ['implementador-go', 'implementador-react', 'build-fix-go', 'build-fix-react']) {
    const lista = frontmatter(ler(`${nome}.md`)).tools.split(',').map((t) => t.trim())
    assert.ok(lista.includes('Edit') && lista.includes('Write'), nome)
  }
})

test('derivados estão no upstream.json', () => {
  const pecas = new Map(upstream.pecas.map((p) => [p.peca, p]))
  for (const arquivo of arquivos.filter((a) => !proprios.includes(a.replace(/\.md$/, '')))) {
    const peca = `agents/${arquivo.replace(/\.md$/, '')}`
    assert.ok(pecas.has(peca), `${peca}: sem entrada em upstream.json`)
    assert.ok(pecas.get(peca).origens.length > 0, `${peca}: sem origens`)
  }
  for (const peca of pecas.keys()) {
    if (!peca.startsWith('agents/')) continue
    assert.ok(arquivos.includes(`${peca.replace('agents/', '')}.md`), `${peca}: peça sem agent`)
  }
})

test('regras citadas pelos agents existem no pacote', () => {
  for (const arquivo of arquivos) {
    for (const m of ler(arquivo).matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/(rules\/[\w.-]+)/g)) {
      assert.ok(existsSync(m[1]), `${arquivo}: ${m[1]} não existe`)
    }
  }
  assert.match(ler('code-reviewer.md'), /rules\/code-review\.md/)
  assert.match(ler('redator-ptbr.md'), /rules\/text-pt-br\.md/)
  assert.match(ler('git.md'), /rules\/git\.md/)
})

test('agents citam skills que existem', () => {
  const skills = readdirSync('skills')
  const conhecidas = new Set(skills)
  for (const arquivo of arquivos) {
    for (const m of ler(arquivo).matchAll(/skills? `([a-z-]+)`/g)) {
      assert.ok(conhecidas.has(m[1]), `${arquivo}: skill ${m[1]} não existe`)
    }
  }
})

test('nenhum agent manda invocar skill sempre nem carrega infra de upstream', () => {
  for (const arquivo of arquivos) {
    const texto = ler(arquivo)
    assert.doesNotMatch(texto, /MUST (use|invoke)|ABSOLUTELY MUST|1% chance/i, arquivo)
    assert.doesNotMatch(texto, /\.omc\/|session-data|oh-my-claudecode|state_write|notepad_/, arquivo)
  }
})

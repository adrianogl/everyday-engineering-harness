import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { atualizarClone, diffOrigens, itensNovos, registrarCommit, validarManifesto } from '../scripts/lib/upstream.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const SHA_A = 'a'.repeat(40)

function git(cwd, ...args) {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=teste', ...args], { cwd, encoding: 'utf8' }).trim()
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-up-'))
  git(dir, 'init', '-q', '-b', 'main')
  mkdirSync(join(dir, 'skills', 'frete'), { recursive: true })
  writeFileSync(join(dir, 'skills', 'frete', 'SKILL.md'), 'cotar frete\n')
  writeFileSync(join(dir, 'skills', 'seguro.md'), 'apolice\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'um')
  const base = git(dir, 'rev-parse', 'HEAD')
  return { dir, base }
}

function commitar(dir, mensagem) {
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', mensagem)
  return git(dir, 'rev-parse', 'HEAD')
}

function manifestoCom(origem) {
  return {
    fontes: { ecc: { repo: 'x', licenca: 'MIT' } },
    pecas: [{ peca: 'skills/cotar', origens: [{ fonte: 'ecc', ...origem }] }],
  }
}

test('validarManifesto aceita o upstream.json do repo', () => {
  const m = JSON.parse(readFileSync(join(raiz, 'upstream.json'), 'utf8'))
  assert.deepEqual(validarManifesto(m), [])
})

test('validarManifesto aponta commit inválido e origem sem base', () => {
  const m = {
    fontes: { ecc: { repo: 'x' }, omc: {} },
    pecas: [
      { peca: 'a', origens: [{ fonte: 'ecc', caminho: 'p', commit: 'abc' }, { fonte: 'ecc', caminho: 'q' }, { fonte: 'zzz', caminho: 'r', versao: '1' }] },
      { peca: 'b', origens: [] },
    ],
  }
  const erros = validarManifesto(m).join('\n')
  assert.match(erros, /fonte omc sem repo/)
  assert.match(erros, /commit inválido abc/)
  assert.match(erros, /sem commit nem versao/)
  assert.match(erros, /fonte desconhecida zzz/)
  assert.match(erros, /peça b sem origens/)
})

test('diffOrigens com commit e arquivo alterado sai mudou com o diff', () => {
  const { dir, base } = fixture()
  writeFileSync(join(dir, 'skills', 'frete', 'SKILL.md'), 'cotar frete com seguro\n')
  const head = commitar(dir, 'dois')
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'skills/frete/SKILL.md', commit: base }), clones: { ecc: { dir, head } } })
  assert.equal(r.status, 'mudou')
  assert.equal(r.base, base)
  assert.equal(r.head, head)
  assert.match(r.diff, /\+cotar frete com seguro/)
})

test('diffOrigens sem mudança sai igual', () => {
  const { dir, base } = fixture()
  writeFileSync(join(dir, 'outro.md'), 'x\n')
  const head = commitar(dir, 'dois')
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'skills/frete/SKILL.md', commit: base }), clones: { ecc: { dir, head } } })
  assert.equal(r.status, 'igual')
  assert.equal(r.diff, '')
})

test('diffOrigens com arquivo apagado sai removido', () => {
  const { dir, base } = fixture()
  rmSync(join(dir, 'skills', 'frete'), { recursive: true })
  const head = commitar(dir, 'dois')
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'skills/frete/SKILL.md', commit: base }), clones: { ecc: { dir, head } } })
  assert.equal(r.status, 'removido')
})

test('diffOrigens com versao sai sem-base', () => {
  const { dir, base } = fixture()
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'skills/frete/SKILL.md', versao: '1.0.0' }), clones: { ecc: { dir, head: base } } })
  assert.equal(r.status, 'sem-base')
  assert.equal(r.base, null)
  assert.equal(r.diff, 'cotar frete\n')
})

test('diffOrigens busca o commit base quando o clone raso não o tem', () => {
  const { dir, base } = fixture()
  writeFileSync(join(dir, 'skills', 'frete', 'SKILL.md'), 'nova\n')
  const head = commitar(dir, 'dois')
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  const clone = atualizarClone({ fonte: 'ecc', repo: `file://${dir}`, cache })
  assert.equal(clone.ok, true)
  assert.equal(clone.head, head)
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'skills/frete/SKILL.md', commit: base }), clones: { ecc: clone } })
  assert.equal(r.status, 'mudou')
  const atualizado = atualizarClone({ fonte: 'ecc', repo: `file://${dir}`, cache })
  assert.equal(atualizado.ok, true)
})

test('atualizarClone com git falhando devolve ok false e o erro', () => {
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  const r = atualizarClone({ fonte: 'ecc', repo: 'file:///tmp/x', cache, git: () => ({ status: 128, stdout: '', stderr: 'fatal: sem rede' }) })
  assert.equal(r.ok, false)
  assert.match(r.erro, /sem rede/)
  assert.equal(r.dir, join(cache, 'ecc'))
})

test('itensNovos ignora o que está na triagem', () => {
  const { dir } = fixture()
  mkdirSync(join(dir, 'agents'))
  writeFileSync(join(dir, 'agents', 'corretor.md'), 'x\n')
  mkdirSync(join(dir, 'commands'))
  writeFileSync(join(dir, 'commands', 'cotar.md'), 'x\n')
  const triagem = 'ECC\tskill\tfrete\tnao\tcotar frete\nOMC\tagent\tcorretor\tnao\tx\n'
  const novos = itensNovos({ clones: { ecc: { dir, head: 'h' } }, triagem })
  assert.deepEqual(
    novos.map((n) => `${n.fonte}:${n.tipo}:${n.nome}`).sort(),
    ['ecc:agent:corretor', 'ecc:command:cotar'],
  )
  assert.equal(novos.find((n) => n.nome === 'corretor').caminho, 'agents/corretor.md')
})

test('itensNovos aceita skill-bodies no omc', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eeh-omc-'))
  mkdirSync(join(dir, 'skill-bodies', 'rota'), { recursive: true })
  writeFileSync(join(dir, 'skill-bodies', 'rota', 'SKILL.md'), 'x\n')
  const novos = itensNovos({ clones: { omc: { dir, head: 'h' } }, triagem: '' })
  assert.deepEqual(novos, [{ fonte: 'omc', tipo: 'skill', nome: 'rota', caminho: 'skill-bodies/rota/SKILL.md' }])
})

test('registrarCommit troca versao por commit', () => {
  const m = manifestoCom({ caminho: 'p.md', versao: '1.0.0' })
  const novo = registrarCommit(m, { peca: 'skills/cotar', fonte: 'ecc', caminho: 'p.md', commit: SHA_A })
  assert.deepEqual(novo.pecas[0].origens[0], { fonte: 'ecc', caminho: 'p.md', commit: SHA_A })
  assert.equal(m.pecas[0].origens[0].versao, '1.0.0')
  assert.throws(() => registrarCommit(m, { peca: 'skills/cotar', fonte: 'ecc', caminho: 'nada.md', commit: SHA_A }), /origem não encontrada/)
})

test('CLI buscar segue quando uma fonte falha', () => {
  const { dir } = fixture()
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  const manifesto = join(mkdtempSync(join(tmpdir(), 'eeh-man-')), 'upstream.json')
  writeFileSync(manifesto, JSON.stringify({
    fontes: { ecc: { repo: join(tmpdir(), 'nao-existe-eeh'), licenca: 'MIT' }, omc: { repo: `file://${dir}`, licenca: 'MIT' } },
    pecas: [],
  }))
  const r = spawnSync('node', [join(raiz, 'scripts', 'upstream.mjs'), 'buscar', '--manifesto', manifesto], {
    encoding: 'utf8',
    env: { ...process.env, EEH_UPSTREAM_CACHE: cache },
  })
  assert.equal(r.status, 0, r.stderr)
  const saida = JSON.parse(r.stdout)
  assert.equal(saida.fontes.ecc.ok, false)
  assert.equal(saida.fontes.omc.ok, true)
  assert.ok(saida.fontes.omc.dir.startsWith(cache))
})

test('diffOrigens com commit hostil sai sem-base sem chamar o diff', () => {
  const { dir, base } = fixture()
  const chamadas = []
  const espiao = (args, cwd) => {
    chamadas.push(args)
    return { status: 0, stdout: '', stderr: '' }
  }
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'p.md', commit: '--output=/tmp/x' }), clones: { ecc: { dir, head: base } }, git: espiao })
  assert.equal(r.status, 'sem-base')
  assert.match(r.erro, /commit inválido/)
  assert.ok(!chamadas.some((a) => a.includes('diff') || a.includes('--output=/tmp/x')))
})

test('diffOrigens com git diff falhando sai erro', () => {
  const { dir, base } = fixture()
  const git = (args) => (args[0] === 'diff' ? { status: 128, stdout: '', stderr: 'fatal: boom' } : { status: 0, stdout: '', stderr: '' })
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'skills/frete/SKILL.md', commit: base }), clones: { ecc: { dir, head: base } }, git })
  assert.equal(r.status, 'erro')
  assert.match(r.erro, /boom/)
})

test('diffOrigens guarda o erro do fetch do commit base', () => {
  const { dir, base } = fixture()
  const git = (args) => {
    if (args[0] === 'cat-file' && args[2].includes('^{commit}')) return { status: 1, stdout: '', stderr: '' }
    if (args[0] === 'fetch') return { status: 128, stdout: '', stderr: 'fatal: sem rede' }
    return { status: 0, stdout: '', stderr: '' }
  }
  const [r] = diffOrigens({ manifesto: manifestoCom({ caminho: 'p.md', commit: SHA_A }), clones: { ecc: { dir, head: base } }, git })
  assert.equal(r.status, 'sem-base')
  assert.match(r.erro, /sem rede/)
})

test('atualizarClone rejeita fonte fora do padrão e separa repo com --', () => {
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  let chamou = false
  const r = atualizarClone({ fonte: '../../x', repo: 'x', cache, git: () => { chamou = true; return { status: 0, stdout: '', stderr: '' } } })
  assert.equal(r.ok, false)
  assert.equal(chamou, false)
  const args = []
  atualizarClone({ fonte: 'ecc', repo: '/tmp/--upload-pack=x', cache, git: (a) => { args.push(a); return { status: 1, stdout: '', stderr: 'e' } } })
  assert.deepEqual(args[0].slice(0, 5), ['clone', '--depth', '1', '--', '/tmp/--upload-pack=x'])
})

test('validarManifesto rejeita nome de fonte fora do padrão', () => {
  const erros = validarManifesto({ fontes: { '../x': { repo: 'r' } }, pecas: [] })
  assert.match(erros.join('\n'), /nome de fonte inválido/)
})

test('validarManifesto e atualizarClone só aceitam https, file ou caminho absoluto', () => {
  for (const repo of ['ext::sh -c id', '--upload-pack=x', 'http://x/y', 'git@host:a/b', 'relativo/repo']) {
    assert.match(validarManifesto({ fontes: { ecc: { repo } }, pecas: [] }).join('\n'), /protocolo não permitido/, repo)
    const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
    let chamou = false
    const r = atualizarClone({ fonte: 'ecc', repo, cache, git: () => { chamou = true; return { status: 0, stdout: '', stderr: '' } } })
    assert.equal(r.ok, false, repo)
    assert.equal(chamou, false, repo)
  }
  for (const repo of ['https://exemplo.test/a.git', 'file:///tmp/x', '/tmp/x']) {
    assert.deepEqual(validarManifesto({ fontes: { ecc: { repo } }, pecas: [] }), [], repo)
  }
})

test('CLI diff, novos e buscar abortam com manifesto inválido', () => {
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  const manifesto = join(mkdtempSync(join(tmpdir(), 'eeh-man-')), 'upstream.json')
  writeFileSync(manifesto, JSON.stringify({ fontes: { '../../x': { repo: 'ext::sh -c id' } }, pecas: [] }))
  for (const comando of ['buscar', 'diff', 'novos']) {
    const r = spawnSync('node', [join(raiz, 'scripts', 'upstream.mjs'), comando, '--manifesto', manifesto], {
      encoding: 'utf8',
      env: { ...process.env, EEH_UPSTREAM_CACHE: cache },
    })
    assert.equal(r.status, 1, comando)
    assert.match(r.stderr, /nome de fonte inválido/, comando)
    assert.match(r.stderr, /protocolo não permitido/, comando)
  }
})

test('fetch falha num clone existente e diff não usa o clone velho', () => {
  const { dir, base } = fixture()
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  const manifesto = join(mkdtempSync(join(tmpdir(), 'eeh-man-')), 'upstream.json')
  writeFileSync(manifesto, JSON.stringify({
    fontes: { omc: { repo: `file://${dir}`, licenca: 'MIT' } },
    pecas: [{ peca: 'skills/cotar', origens: [{ fonte: 'omc', caminho: 'skills/seguro.md', commit: base }] }],
  }))
  const rodar = (comando) => spawnSync('node', [join(raiz, 'scripts', 'upstream.mjs'), comando, '--manifesto', manifesto], {
    encoding: 'utf8',
    env: { ...process.env, EEH_UPSTREAM_CACHE: cache },
  })
  assert.equal(rodar('buscar').status, 0)
  writeFileSync(join(dir, 'skills', 'seguro.md'), 'apolice nova\n')
  commitar(dir, 'dois')
  const antes = JSON.parse(rodar('diff').stdout)
  assert.equal(antes[0].status, 'igual')

  rmSync(dir, { recursive: true, force: true })
  const busca = rodar('buscar')
  assert.equal(busca.status, 0, busca.stderr)
  assert.equal(JSON.parse(busca.stdout).fontes.omc.ok, false)
  const status = JSON.parse(readFileSync(join(cache, 'omc.status.json'), 'utf8'))
  assert.equal(status.ok, false)
  assert.ok(status.erro)

  const diff = JSON.parse(rodar('diff').stdout)
  assert.equal(diff.length, 1)
  assert.equal(diff[0].fonte, 'omc')
  assert.equal(diff[0].status, 'desatualizado')
  assert.ok(diff[0].erro)
  const triagem = join(mkdtempSync(join(tmpdir(), 'eeh-tri-')), 'triagem.tsv')
  writeFileSync(triagem, '')
  const novos = spawnSync('node', [join(raiz, 'scripts', 'upstream.mjs'), 'novos', '--manifesto', manifesto, '--triagem', triagem], {
    encoding: 'utf8',
    env: { ...process.env, EEH_UPSTREAM_CACHE: cache },
  })
  assert.deepEqual(JSON.parse(novos.stdout).map((n) => n.status), ['desatualizado'])
})

test('diff e novos marcam fonte sem busca como desatualizada', () => {
  const cache = mkdtempSync(join(tmpdir(), 'eeh-cache-'))
  const manifesto = join(mkdtempSync(join(tmpdir(), 'eeh-man-')), 'upstream.json')
  writeFileSync(manifesto, JSON.stringify({ fontes: { omc: { repo: 'file:///x', licenca: 'MIT' } }, pecas: [] }))
  const r = spawnSync('node', [join(raiz, 'scripts', 'upstream.mjs'), 'diff', '--manifesto', manifesto], {
    encoding: 'utf8',
    env: { ...process.env, EEH_UPSTREAM_CACHE: cache },
  })
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(JSON.parse(r.stdout).map((x) => [x.fonte, x.status]), [['omc', 'desatualizado']])
})

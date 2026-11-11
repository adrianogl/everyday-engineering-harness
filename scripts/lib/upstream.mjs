import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'

const SHA = /^[0-9a-f]{40}$/
const NOME_FONTE = /^[a-z0-9_-]+$/
const PROTOCOLOS_GIT = 'https:file'

export function nomeFonteValido(nome) {
  return typeof nome === 'string' && NOME_FONTE.test(nome)
}

export function repoValido(repo) {
  if (typeof repo !== 'string') return false
  return repo.startsWith('https://') || repo.startsWith('file://') || isAbsolute(repo)
}
const ORIGENS = { ECC: 'ecc', OMC: 'omc', SP: 'superpowers' }
const PASTAS_SKILL = { ecc: ['skills'], omc: ['skills', 'skill-bodies'], superpowers: ['skills'] }

export function gitPadrao(args, cwd) {
  const r = spawnSync('git', ['-c', 'protocol.ext.allow=never', ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_ALLOW_PROTOCOL: PROTOCOLOS_GIT },
  })
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? (r.error ? String(r.error.message) : '') }
}

export function pastaCache({ env = process.env } = {}) {
  const configurada = env.EEH_UPSTREAM_CACHE
  if (typeof configurada === 'string' && configurada.trim() !== '') return configurada.trim()
  return join(homedir(), '.cache', 'eeh', 'upstream')
}

export function validarManifesto(m) {
  const erros = []
  const fontes = m?.fontes && typeof m.fontes === 'object' ? m.fontes : {}
  if (!m?.fontes || typeof m.fontes !== 'object') erros.push('fontes ausente')
  for (const [nome, fonte] of Object.entries(fontes)) {
    if (!NOME_FONTE.test(nome)) erros.push(`nome de fonte inválido ${nome}`)
    if (typeof fonte?.repo !== 'string' || fonte.repo === '') erros.push(`fonte ${nome} sem repo`)
    else if (!repoValido(fonte.repo)) erros.push(`fonte ${nome}: repo com protocolo não permitido ${fonte.repo}`)
  }
  if (!Array.isArray(m?.pecas)) {
    erros.push('pecas ausente')
    return erros
  }
  for (const p of m.pecas) {
    const rotulo = p?.peca ?? '(sem nome)'
    if (!Array.isArray(p?.origens) || p.origens.length === 0) {
      erros.push(`peça ${rotulo} sem origens`)
      continue
    }
    for (const o of p.origens) {
      const id = `${rotulo} (${o?.caminho ?? 'sem caminho'})`
      if (!o?.fonte || !Object.hasOwn(fontes, o.fonte)) erros.push(`${id}: fonte desconhecida ${o?.fonte}`)
      if (o?.commit === undefined && o?.versao === undefined) erros.push(`${id}: sem commit nem versao`)
      if (o?.commit !== undefined && !(typeof o.commit === 'string' && SHA.test(o.commit))) {
        erros.push(`${id}: commit inválido ${o.commit}`)
      }
    }
  }
  return erros
}

export function atualizarClone({ fonte, repo, cache, git = gitPadrao }) {
  const dir = join(cache, String(fonte))
  if (!nomeFonteValido(fonte)) return { ok: false, dir, erro: `nome de fonte inválido: ${fonte}` }
  if (!repoValido(repo)) return { ok: false, dir, erro: `repo com protocolo não permitido: ${repo}` }
  try {
    if (!existsSync(join(dir, '.git'))) {
      mkdirSync(cache, { recursive: true })
      const r = git(['clone', '--depth', '1', '--', repo, dir])
      if (r.status !== 0) return { ok: false, dir, erro: r.stderr.trim() || 'clone falhou' }
    } else {
      const f = git(['fetch', '--depth', '1', 'origin', 'HEAD'], dir)
      if (f.status !== 0) return { ok: false, dir, erro: f.stderr.trim() || 'fetch falhou' }
      const r = git(['reset', '--hard', 'FETCH_HEAD'], dir)
      if (r.status !== 0) return { ok: false, dir, erro: r.stderr.trim() || 'reset falhou' }
    }
    const h = git(['rev-parse', 'HEAD'], dir)
    if (h.status !== 0) return { ok: false, dir, erro: h.stderr.trim() || 'rev-parse falhou' }
    return { ok: true, dir, head: h.stdout.trim() }
  } catch (erro) {
    return { ok: false, dir, erro: erro.message }
  }
}

export function gravarStatusBusca({ fonte, cache, resultado, agora = () => new Date().toISOString() }) {
  mkdirSync(cache, { recursive: true })
  const status = { ok: resultado.ok === true, head: resultado.head ?? null, erro: resultado.erro ?? null, data: agora() }
  writeFileSync(join(cache, `${fonte}.status.json`), `${JSON.stringify(status, null, 2)}\n`)
  return status
}

export function lerStatusBusca({ fonte, cache }) {
  try {
    return JSON.parse(readFileSync(join(cache, `${fonte}.status.json`), 'utf8'))
  } catch {
    return null
  }
}

export function separarFontes({ manifesto, cache, git = gitPadrao }) {
  const clones = {}
  const desatualizadas = []
  for (const fonte of Object.keys(manifesto.fontes ?? {})) {
    if (!nomeFonteValido(fonte)) continue
    const status = lerStatusBusca({ fonte, cache })
    if (!status) {
      desatualizadas.push({ fonte, status: 'desatualizado', erro: 'buscar ainda não rodou para esta fonte' })
      continue
    }
    if (status.ok !== true) {
      desatualizadas.push({ fonte, status: 'desatualizado', erro: status.erro || 'última busca falhou' })
      continue
    }
    const dir = join(cache, fonte)
    if (!existsSync(join(dir, '.git'))) {
      desatualizadas.push({ fonte, status: 'desatualizado', erro: 'clone ausente no cache' })
      continue
    }
    const h = git(['rev-parse', 'HEAD'], dir)
    if (h.status !== 0) {
      desatualizadas.push({ fonte, status: 'desatualizado', erro: h.stderr.trim() || 'rev-parse falhou' })
      continue
    }
    clones[fonte] = { dir, head: h.stdout.trim() }
  }
  return { clones, desatualizadas }
}

function caminhosAlternativos(fonte, caminho) {
  if (fonte !== 'omc') return [caminho]
  const m = caminho.match(/^(skills|skill-bodies)\/(.+)$/)
  if (!m) return [caminho]
  return [caminho, `${m[1] === 'skills' ? 'skill-bodies' : 'skills'}/${m[2]}`]
}

function existeNoHead(git, dir, head, caminho) {
  return git(['cat-file', '-e', `${head}:${caminho}`], dir).status === 0
}

export function diffOrigens({ manifesto, clones, git = gitPadrao }) {
  const mudancas = []
  for (const p of manifesto.pecas ?? []) {
    for (const o of p.origens ?? []) {
      const clone = clones?.[o.fonte]
      if (!clone) continue
      const { dir, head } = clone
      const caminho = caminhosAlternativos(o.fonte, o.caminho).find((c) => existeNoHead(git, dir, head, c)) ?? o.caminho
      const base = { peca: p.peca, fonte: o.fonte, caminho: o.caminho }
      if (!o.commit) {
        const atual = git(['show', `${head}:${caminho}`], dir)
        mudancas.push({ ...base, base: null, head, status: 'sem-base', diff: atual.status === 0 ? atual.stdout : '' })
        continue
      }
      if (!SHA.test(o.commit)) {
        mudancas.push({ ...base, base: null, head, status: 'sem-base', diff: '', erro: `commit inválido: ${o.commit}` })
        continue
      }
      let erroFetch
      if (git(['cat-file', '-e', `${o.commit}^{commit}`], dir).status !== 0) {
        const f = git(['fetch', '--depth', '1', 'origin', '--end-of-options', o.commit], dir)
        if (f.status !== 0) erroFetch = f.stderr.trim() || 'fetch do commit base falhou'
      }
      if (git(['cat-file', '-e', `${o.commit}^{commit}`], dir).status !== 0) {
        mudancas.push({ ...base, base: o.commit, head, status: 'sem-base', diff: '', erro: erroFetch ?? 'commit base ausente no clone' })
        continue
      }
      const d = git(['diff', o.commit, head, '--', ...new Set([o.caminho, caminho])], dir)
      if (d.status !== 0) {
        mudancas.push({ ...base, base: o.commit, head, status: 'erro', diff: '', erro: d.stderr.trim() || 'git diff falhou' })
        continue
      }
      const status = !existeNoHead(git, dir, head, caminho) ? 'removido' : d.stdout.trim() === '' ? 'igual' : 'mudou'
      mudancas.push({ ...base, base: o.commit, head, status, diff: d.stdout })
    }
  }
  return mudancas
}

function listar(dir, pasta, tipo) {
  const raiz = join(dir, pasta)
  if (!existsSync(raiz)) return []
  const entradas = readdirSync(raiz, { withFileTypes: true })
  if (tipo === 'skill') {
    return entradas
      .filter((e) => e.isDirectory() && existsSync(join(raiz, e.name, 'SKILL.md')))
      .map((e) => ({ nome: e.name, caminho: `${pasta}/${e.name}/SKILL.md` }))
  }
  return entradas
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => ({ nome: e.name.slice(0, -3), caminho: `${pasta}/${e.name}` }))
}

export function itensNovos({ clones, triagem }) {
  const triados = new Set()
  for (const linha of String(triagem).split('\n')) {
    const [origem, , nome] = linha.split('\t')
    if (origem && nome && ORIGENS[origem.trim()]) triados.add(`${ORIGENS[origem.trim()]}:${nome.trim()}`)
  }
  const novos = []
  for (const [fonte, clone] of Object.entries(clones)) {
    const achados = [
      ...(PASTAS_SKILL[fonte] ?? ['skills']).flatMap((pasta) => listar(clone.dir, pasta, 'skill').map((i) => ({ ...i, tipo: 'skill' }))),
      ...listar(clone.dir, 'agents', 'agent').map((i) => ({ ...i, tipo: 'agent' })),
      ...listar(clone.dir, 'commands', 'command').map((i) => ({ ...i, tipo: 'command' })),
    ]
    const vistos = new Set()
    for (const item of achados) {
      const chave = `${fonte}:${item.nome}`
      if (triados.has(chave) || vistos.has(`${item.tipo}:${chave}`)) continue
      vistos.add(`${item.tipo}:${chave}`)
      novos.push({ fonte, tipo: item.tipo, nome: item.nome, caminho: item.caminho })
    }
  }
  return novos
}

export function registrarCommit(manifesto, { peca, fonte, caminho, commit }) {
  if (typeof commit !== 'string' || !SHA.test(commit)) throw new Error(`commit inválido: ${commit}`)
  const copia = structuredClone(manifesto)
  const origem = copia.pecas.find((p) => p.peca === peca)?.origens.find((o) => o.fonte === fonte && o.caminho === caminho)
  if (!origem) throw new Error(`origem não encontrada: ${peca} ${fonte} ${caminho}`)
  delete origem.versao
  origem.commit = commit
  return copia
}

export function lerManifesto(arquivo) {
  return JSON.parse(readFileSync(arquivo, 'utf8'))
}

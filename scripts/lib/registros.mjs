import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const ARQUIVOS = { decisao: 'decisoes.md', abordagem: 'abordagens.md', nota: 'notas.md' }
const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
const CHAVE = /^(_geral|[A-Z][A-Z0-9]*-\d+)$/

function expandirHome(caminho) {
  if (caminho === '~') return homedir()
  if (caminho.startsWith('~/')) return join(homedir(), caminho.slice(2))
  return caminho
}

function raizDoRepo(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

export function pastaRegistros({ perfil, cwd = process.cwd() } = {}) {
  const configurada = perfil?.registros
  if (typeof configurada === 'string' && configurada.trim() !== '') return resolve(expandirHome(configurada.trim()))
  const repo = raizDoRepo(cwd)
  return join(repo ? dirname(repo) : resolve(cwd), '.eeh')
}

export function pastaEntrega({ base, chave, slug }) {
  if (typeof chave !== 'string' || !CHAVE.test(chave)) throw new Error(`chave inválida: ${chave}`)
  if (slug !== undefined && (typeof slug !== 'string' || !SLUG.test(slug))) throw new Error(`slug inválido: ${slug}`)
  if (chave === '_geral') return join(base, '_geral')
  if (existsSync(base)) {
    const existente = readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory() && (e.name === chave || e.name.startsWith(`${chave}-`)))
      .map((e) => e.name)
      .sort()[0]
    if (existente) return join(base, existente)
  }
  return join(base, slug ? `${chave}-${slug}` : chave)
}

export function registrar({ base, chave, tipo, texto, data }) {
  const arquivo = ARQUIVOS[tipo]
  if (!arquivo) throw new Error(`tipo inválido: ${tipo} (use ${Object.keys(ARQUIVOS).join(', ')})`)
  const pasta = pastaEntrega({ base, chave })
  mkdirSync(pasta, { recursive: true })
  const caminho = join(pasta, arquivo)
  const dia = data ?? new Date().toISOString().slice(0, 10)
  const prefixo = existsSync(caminho) ? '\n' : ''
  appendFileSync(caminho, `${prefixo}## ${dia}\n\n${String(texto).trim()}\n`)
  return caminho
}

export function listarEntregas({ base, limite = 30 }) {
  try {
    return readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== '_geral' && /^[A-Z][A-Z0-9]*-\d+/.test(e.name))
      .map((e) => e.name)
      .sort()
      .slice(0, limite)
  } catch {
    return []
  }
}

export function ler({ base, chave }) {
  const pasta = pastaEntrega({ base, chave })
  const secoes = Object.values(ARQUIVOS)
    .filter((arquivo) => existsSync(join(pasta, arquivo)))
    .map((arquivo) => `# ${arquivo}\n\n${readFileSync(join(pasta, arquivo), 'utf8').trim()}`)
  if (secoes.length === 0) return `Sem registros para ${chave} em ${pasta}.`
  return `Pasta: ${pasta}\n\n${secoes.join('\n\n')}`
}

export function extrairChaves(texto, maximo = 3) {
  const achadas = String(texto ?? '').match(/\b[A-Z][A-Z0-9]*-\d+\b/g) ?? []
  return [...new Set(achadas)].slice(0, maximo)
}

export function registrosDoPrompt({ prompt, base, limite = 10000 }) {
  const blocos = []
  for (const chave of extrairChaves(prompt)) {
    const texto = ler({ base, chave })
    if (!texto.startsWith('Sem registros')) blocos.push(`## Registros de ${chave}\n\n${texto}`)
  }
  if (blocos.length === 0) return ''
  const total = `# Registros das entregas citadas no pedido\n\n${blocos.join('\n\n---\n\n')}`
  if (total.length <= limite) return total
  const aviso = '\n\n[registros truncados; use `registros.mjs ler <CHAVE>` para ver o resto]'
  return total.slice(0, limite - aviso.length) + aviso
}

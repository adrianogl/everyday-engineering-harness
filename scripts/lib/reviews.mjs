import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pastaEntrega } from './registros.mjs'

const REPO = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/
const TIPOS = ['bloqueante', 'nit']
const STATUS = ['aberto', 'resolvido', 'descartado']
const RESULTADOS = ['PEDIR MUDANÇAS', 'APROVAR']
const LINHA_ITEM = /^- (C-\d+) \[([^\]]+)\] \[([^\]]+)\] (.+?):(\d+) — (.*)$/
const MOTIVO = / \(motivo: (.*)\)$/
const LINHA_RODADA = /^- (\S+) (\S+) (.+)$/

function validar(repo, numero) {
  if (typeof repo !== 'string' || !REPO.test(repo)) throw new Error(`repo inválido: ${repo}`)
  if (!Number.isInteger(numero) || numero <= 0) throw new Error(`numero inválido: ${numero}`)
}

export function pastaReview({ base, repo, numero, chave }) {
  validar(repo, numero)
  const nome = `${repo}-${numero}`
  if (chave) return join(pastaEntrega({ base, chave }), 'reviews', nome)
  return join(base, '_reviews', nome)
}

function linhasDe(caminho) {
  if (!existsSync(caminho)) return []
  return readFileSync(caminho, 'utf8').split('\n').filter((l) => l.trim() !== '')
}

export function formatarItem({ id, tipo, status, arquivo, linha, texto, motivo }) {
  const sufixo = status === 'descartado' ? ` (motivo: ${motivo})` : ''
  return `- ${id} [${tipo}] [${status}] ${arquivo}:${linha} — ${texto}${sufixo}`
}

function parsearItem(linha) {
  const m = LINHA_ITEM.exec(linha)
  if (!m) return null
  const item = { id: m[1], tipo: m[2], status: m[3], arquivo: m[4], linha: Number(m[5]), texto: m[6] }
  const motivo = item.status === 'descartado' ? MOTIVO.exec(item.texto) : null
  if (motivo) {
    item.texto = item.texto.slice(0, motivo.index)
    item.motivo = motivo[1]
  }
  return item
}

export function registrarItem({ pasta, arquivo, linha, tipo, texto }) {
  if (!TIPOS.includes(tipo)) throw new Error(`tipo inválido: ${tipo} (use ${TIPOS.join(', ')})`)
  if (typeof arquivo !== 'string' || arquivo.trim() === '') throw new Error('arquivo obrigatório')
  if (/[\r\n]/.test(arquivo)) throw new Error('arquivo inválido: não pode conter quebra de linha')
  const numeroLinha = typeof linha === 'number' || (typeof linha === 'string' && /^\d+$/.test(linha)) ? Number(linha) : NaN
  if (!Number.isInteger(numeroLinha) || numeroLinha <= 0) throw new Error(`linha inválida: ${linha}`)
  const limpo = typeof texto === 'string' ? texto.replace(/\s+/g, ' ').trim() : ''
  if (limpo === '') throw new Error('texto obrigatório')
  const caminho = join(pasta, 'comentarios.md')
  const ids = linhasDe(caminho).map(parsearItem).filter(Boolean).map((i) => Number(i.id.slice(2)))
  const id = `C-${Math.max(0, ...ids) + 1}`
  mkdirSync(pasta, { recursive: true })
  appendFileSync(caminho, `${formatarItem({ id, tipo, status: 'aberto', arquivo: arquivo.trim(), linha: numeroLinha, texto: limpo })}\n`)
  return id
}

export function atualizarItem({ pasta, id, status, motivo }) {
  if (!STATUS.includes(status)) throw new Error(`status inválido: ${status} (use ${STATUS.join(', ')})`)
  if (status === 'descartado' && (typeof motivo !== 'string' || motivo.trim() === '')) throw new Error('descartado exige motivo')
  const motivoLimpo = typeof motivo === 'string' ? motivo.replace(/\s+/g, ' ').trim() : undefined
  const caminho = join(pasta, 'comentarios.md')
  const linhas = linhasDe(caminho)
  const indice = linhas.findIndex((l) => parsearItem(l)?.id === id)
  if (indice === -1) throw new Error(`item inexistente: ${id}`)
  const item = parsearItem(linhas[indice])
  linhas[indice] = formatarItem({ ...item, status, motivo: status === 'descartado' ? motivoLimpo : undefined })
  writeFileSync(caminho, `${linhas.join('\n')}\n`)
}

export function registrarRodada({ pasta, commit, resultado, data }) {
  if (!RESULTADOS.includes(resultado)) throw new Error(`resultado inválido: ${resultado} (use ${RESULTADOS.join(', ')})`)
  if (typeof commit !== 'string' || commit.trim() === '') throw new Error('commit obrigatório')
  if (/\s/.test(commit.trim())) throw new Error('commit inválido: não pode conter espaço em branco')
  mkdirSync(pasta, { recursive: true })
  const dia = data ?? new Date().toISOString().slice(0, 10)
  appendFileSync(join(pasta, 'rodadas.md'), `- ${dia} ${commit.trim()} ${resultado}\n`)
}

export function lerHistorico(pasta) {
  const itens = linhasDe(join(pasta, 'comentarios.md')).map(parsearItem).filter(Boolean)
  const rodadas = linhasDe(join(pasta, 'rodadas.md'))
    .map((l) => LINHA_RODADA.exec(l))
    .filter(Boolean)
    .map((m) => ({ data: m[1], commit: m[2], resultado: m[3] }))
  return { itens, rodadas }
}

export function extrairPrs(texto, maximo = 2) {
  const achadas = []
  const padrao = /github\.com\/[A-Za-z0-9_.-]+\/([A-Za-z0-9_-][A-Za-z0-9._-]*)\/pull\/(\d+)|(?<![\w./-])([A-Za-z0-9_-][A-Za-z0-9._-]*)#(\d+)/g
  for (const m of String(texto ?? '').matchAll(padrao)) {
    const repo = m[1] ?? m[3]
    const numero = Number(m[2] ?? m[4])
    if (numero > 0 && !achadas.some((p) => p.repo === repo && p.numero === numero)) achadas.push({ repo, numero })
  }
  return achadas.slice(0, maximo)
}

function acharPasta(base, repo, numero) {
  const nome = `${repo}-${numero}`
  const candidatas = [join(base, '_reviews', nome)]
  try {
    for (const e of readdirSync(base, { withFileTypes: true })) {
      if (e.isDirectory() && e.name !== '_reviews') candidatas.push(join(base, e.name, 'reviews', nome))
    }
  } catch {
    return null
  }
  return candidatas.find((c) => existsSync(c)) ?? null
}

function formatarHistorico({ repo, numero }, { itens, rodadas }) {
  const partes = [`## Review de ${repo}#${numero}`]
  if (itens.length > 0) partes.push(itens.map(formatarItem).join('\n'))
  if (rodadas.length > 0) partes.push(`Rodadas:\n${rodadas.map((r) => `- ${r.data} ${r.commit} ${r.resultado}`).join('\n')}`)
  return partes.join('\n\n')
}

export function reviewsDoPrompt(prompt, { base, limite = 4000 }) {
  const blocos = []
  for (const pr of extrairPrs(prompt)) {
    const pasta = acharPasta(base, pr.repo, pr.numero)
    if (!pasta) continue
    const historico = lerHistorico(pasta)
    if (historico.itens.length === 0 && historico.rodadas.length === 0) continue
    blocos.push(formatarHistorico(pr, historico))
  }
  if (blocos.length === 0) return ''
  const total = `# Histórico de review das PRs citadas no pedido\n\n${blocos.join('\n\n---\n\n')}`
  if (total.length <= limite) return total
  const aviso = '\n\n[histórico truncado; use `reviews.mjs ler` para ver o resto]'
  return total.slice(0, limite - aviso.length) + aviso
}

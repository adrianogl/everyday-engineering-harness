#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { loadPerfil } from './lib/perfil.mjs'
import { pastaRegistros } from './lib/registros.mjs'
import { pastaReview, registrarItem, atualizarItem, registrarRodada, lerHistorico } from './lib/reviews.mjs'

const USO = [
  'uso: reviews.mjs item --repo <r> --numero <n> [--chave <CHAVE>] --arquivo <a> --linha <l> --tipo <bloqueante|nit> --texto <t>',
  '     reviews.mjs atualizar --repo <r> --numero <n> [--chave <CHAVE>] --id <C-n> --status <aberto|resolvido|descartado> [--motivo <m>]',
  '     reviews.mjs rodada --repo <r> --numero <n> [--chave <CHAVE>] --commit <sha> --resultado <"PEDIR MUDANÇAS"|APROVAR>',
  '     reviews.mjs ler --repo <r> --numero <n> [--chave <CHAVE>]',
  '     todos aceitam --base <pasta>',
].join('\n')

const OPCOES = Object.fromEntries(
  ['base', 'repo', 'numero', 'chave', 'arquivo', 'linha', 'tipo', 'texto', 'id', 'status', 'motivo', 'commit', 'resultado'].map((n) => [n, { type: 'string' }]),
)

function formatar({ itens, rodadas }) {
  const linhas = [...itens.map((i) => `- ${i.id} [${i.tipo}] [${i.status}] ${i.arquivo}:${i.linha} — ${i.texto}${i.motivo ? ` (motivo: ${i.motivo})` : ''}`)]
  if (rodadas.length > 0) linhas.push('', ...rodadas.map((r) => `- ${r.data} ${r.commit} ${r.resultado}`))
  return linhas.length > 0 ? linhas.join('\n') : 'Sem histórico.'
}

function main(argv) {
  const [comando, ...resto] = argv
  const { values: v } = parseArgs({ args: resto, options: OPCOES })
  const base = v.base ?? pastaRegistros({ perfil: loadPerfil().perfil, cwd: process.cwd() })
  if (!['item', 'atualizar', 'rodada', 'ler'].includes(comando)) throw new Error(USO)
  const pasta = pastaReview({ base, repo: v.repo, numero: Number(v.numero), chave: v.chave })
  if (comando === 'item') return registrarItem({ pasta, arquivo: v.arquivo, linha: v.linha, tipo: v.tipo, texto: v.texto })
  if (comando === 'atualizar') {
    atualizarItem({ pasta, id: v.id, status: v.status, motivo: v.motivo })
    return `${v.id} ${v.status}`
  }
  if (comando === 'rodada') {
    registrarRodada({ pasta, commit: v.commit, resultado: v.resultado })
    return `rodada registrada em ${pasta}`
  }
  return formatar(lerHistorico(pasta))
}

try {
  process.stdout.write(`${main(process.argv.slice(2))}\n`)
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

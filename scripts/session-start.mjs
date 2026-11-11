#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REGRAS = ['text-pt-br.md', 'comments.md', 'code-review.md', 'git.md']

function lerRegra(rulesDir, nome) {
  try {
    return readFileSync(join(rulesDir, nome), 'utf8').trim()
  } catch {
    return ''
  }
}

function resumoPerfil({ perfil, origem, faltando }) {
  if (!perfil) {
    const motivo = faltando.includes('json') ? 'o arquivo não é um JSON válido' : 'o arquivo não existe'
    return [
      '## Perfil local',
      '',
      `Perfil do EEH não encontrado em \`${origem}\` (${motivo}). Fases que dependem de Jira, Confluence ou dos repos precisam dele: avise o autor e peça o dado que faltar antes de seguir.`
    ].join('\n')
  }
  const linhas = ['## Perfil local', '']
  linhas.push(faltando.length > 0 ? `Perfil carregado com campos faltando: ${faltando.join(', ')}.` : 'Perfil carregado.')
  const repos = Array.isArray(perfil.repos) ? perfil.repos : []
  if (repos.length > 0) {
    linhas.push('', 'Repos:')
    for (const r of repos) linhas.push(`- ${r?.nome ?? '?'} (${r?.stack ?? '?'})`)
  }
  const extensoes = Array.isArray(perfil.extensoes) ? perfil.extensoes.filter((e) => e?.skill) : []
  if (extensoes.length > 0) {
    linhas.push('', 'Extensões (skill e quando oferecer):')
    for (const e of extensoes) linhas.push(`- ${e.skill}: ${e.quando}`)
  }
  return linhas.join('\n')
}

function resumoRegra(rulesDir, nome) {
  const resumo = lerRegra(join(rulesDir, 'resumos'), nome)
  if (!resumo) return ''
  return `${resumo}\n\nTexto completo, para ler antes de tarefa longa e para passar aos agents: \`${join(rulesDir, nome)}\`.`
}

const LIMITE_NOME = 60
const LIMITE_LISTA = 600

function listaEntregas(entregas) {
  const nomes = entregas.map((n) => (n.length > LIMITE_NOME ? `${n.slice(0, LIMITE_NOME)}...` : n))
  const mostrados = []
  let tamanho = 0
  for (const nome of nomes) {
    if (tamanho + nome.length + 2 > LIMITE_LISTA) break
    mostrados.push(nome)
    tamanho += nome.length + 2
  }
  const resto = nomes.length - mostrados.length
  return resto > 0 ? `${mostrados.join(', ')} +${resto}` : mostrados.join(', ')
}

function resumoRegistros(registros, entregas = []) {
  if (!registros) return ''
  const linhas = ['## Registros', '', `Pasta de registros: \`${registros}\`. Cada entrega tem a pasta \`<CHAVE>-<slug>\` com \`decisoes.md\`, \`abordagens.md\` e \`notas.md\`.`]
  if (entregas.length > 0) linhas.push('', `Entregas com registro: ${listaEntregas(entregas)}.`)
  return linhas.join('\n')
}

export function buildContext({ perfilResult, rulesDir, registros, entregas }) {
  const partes = [
    lerRegra(rulesDir, 'orquestrador.md'),
    ...REGRAS.map((nome) => resumoRegra(rulesDir, nome)),
    resumoPerfil(perfilResult),
    resumoRegistros(registros, entregas)
  ]
  return partes.filter(Boolean).join('\n\n---\n\n')
}

async function main() {
  let contexto
  try {
    const { loadPerfil } = await import('./lib/perfil.mjs')
    const rulesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'rules')
    const perfilResult = loadPerfil()
    let registros = ''
    let entregas = []
    try {
      const lib = await import('./lib/registros.mjs')
      registros = lib.pastaRegistros({ perfil: perfilResult.perfil, cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd() })
      entregas = lib.listarEntregas({ base: registros })
    } catch {
      registros = ''
    }
    contexto = buildContext({ perfilResult, rulesDir, registros, entregas })
  } catch {
    contexto = 'EEH: falha ao montar o contexto de base.'
  }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: contexto } }))
  process.exit(0)
}

function rodandoComoCli() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (rodandoComoCli()) await main()

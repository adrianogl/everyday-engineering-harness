import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const OBRIGATORIOS = ['site', 'cloudId', 'projeto', 'accountId']
const STACKS = ['go', 'react']
const QUANDO = /^(atalho|fim:.+)$/

function vazio(valor) {
  return typeof valor !== 'string' || valor.trim() === ''
}

function validar(perfil) {
  const faltando = []
  const atlassian = perfil?.atlassian ?? {}
  for (const campo of OBRIGATORIOS) {
    if (vazio(atlassian[campo])) faltando.push(`atlassian.${campo}`)
  }
  const repos = Array.isArray(perfil?.repos) ? perfil.repos : []
  repos.forEach((repo, i) => {
    if (!STACKS.includes(repo?.stack)) faltando.push(`repos[${i}].stack`)
  })
  const extensoes = Array.isArray(perfil?.extensoes) ? perfil.extensoes : []
  extensoes.forEach((ext, i) => {
    if (typeof ext?.quando !== 'string' || !QUANDO.test(ext.quando)) faltando.push(`extensoes[${i}].quando`)
  })
  return faltando
}

export function loadPerfil({ path, env = process.env } = {}) {
  const origem = path ?? env.EEH_PERFIL ?? join(homedir(), '.config/eeh/perfil.json')
  let bruto
  try {
    bruto = readFileSync(origem, 'utf8')
  } catch {
    return { perfil: null, origem, faltando: ['arquivo'] }
  }
  let perfil
  try {
    perfil = JSON.parse(bruto)
  } catch {
    return { perfil: null, origem, faltando: ['json'] }
  }
  if (perfil === null || typeof perfil !== 'object' || Array.isArray(perfil)) {
    return { perfil: null, origem, faltando: ['json'] }
  }
  return { perfil, origem, faltando: validar(perfil) }
}

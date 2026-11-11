import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const PASTAS_BUSCA = ['commands', 'skills', 'agents', 'rules']

function arquivosMd(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(dir, e.name)
    if (e.isDirectory()) return arquivosMd(caminho)
    return e.isFile() && e.name.endsWith('.md') ? [caminho] : []
  })
}

function pecas(raiz) {
  const skills = existsSync(join(raiz, 'skills'))
    ? readdirSync(join(raiz, 'skills'), { withFileTypes: true })
        .filter((e) => e.isDirectory() && existsSync(join(raiz, 'skills', e.name, 'SKILL.md')))
        .map((e) => ({ nome: e.name, proprio: (rel) => rel.startsWith(`skills/${e.name}/`) }))
    : []
  const agents = existsSync(join(raiz, 'agents'))
    ? readdirSync(join(raiz, 'agents'), { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => ({ nome: e.name.slice(0, -3), proprio: (rel) => rel === `agents/${e.name}` }))
    : []
  return [...skills, ...agents]
}

function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function referencias({ raiz }) {
  const arquivos = PASTAS_BUSCA.flatMap((p) => arquivosMd(join(raiz, p))).map((abs) => ({
    rel: relative(raiz, abs).split(sep).join('/'),
    texto: readFileSync(abs, 'utf8'),
  }))
  const resultado = {}
  for (const peca of pecas(raiz)) {
    const padrao = new RegExp(`(?<![\\w-])${escapar(peca.nome)}(?![\\w-])`)
    resultado[peca.nome] = arquivos
      .filter((a) => !peca.proprio(a.rel) && padrao.test(a.texto))
      .map((a) => a.rel)
      .sort()
  }
  return resultado
}

export function semUso({ raiz }) {
  return Object.entries(referencias({ raiz }))
    .filter(([, lista]) => lista.length === 0)
    .map(([nome]) => nome)
    .sort()
}

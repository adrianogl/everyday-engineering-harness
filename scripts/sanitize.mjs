#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { scan } from './lib/sanitize.mjs'
import { loadPerfil } from './lib/perfil.mjs'

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function lerStaged() {
  const nomes = git(['diff', '--cached', '--name-only', '--diff-filter=ACMRT', '-z'])
    .split('\0')
    .filter(Boolean)
  return nomes.map((caminho) => ({ caminho, conteudo: git(['show', `:${caminho}`]) }))
}

function lerDisco(caminhos) {
  return caminhos.map((caminho) => ({ caminho, conteudo: readFileSync(caminho, 'utf8') }))
}

const args = process.argv.slice(2)
const arquivos = args.includes('--staged') ? lerStaged() : lerDisco(args)
const { perfil } = loadPerfil()
const achados = scan(arquivos, perfil?.denylist ?? [])

for (const a of achados) console.log(`${a.caminho}:${a.linha} ${a.regra}`)
if (achados.length > 0) {
  console.error(`sanitizer: ${achados.length} ocorrência(s) de dado interno; commit bloqueado`)
  process.exit(1)
}

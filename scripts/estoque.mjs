#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { referencias, semUso } from './lib/estoque.mjs'

function main(argv) {
  const i = argv.indexOf('--raiz')
  const raiz = i === -1 ? join(dirname(fileURLToPath(import.meta.url)), '..') : argv[i + 1]
  if (!raiz) throw new Error('uso: estoque.mjs [--raiz <pasta>]')
  const orfas = semUso({ raiz })
  const linhas = ['Sem uso:']
  linhas.push(...(orfas.length ? orfas.map((n) => `  ${n}`) : ['  (nenhuma)']))
  linhas.push('', 'Referências por peça:')
  const contagem = Object.entries(referencias({ raiz })).map(([nome, lista]) => [nome, lista.length])
  const largura = Math.max(0, ...contagem.map(([nome]) => nome.length))
  for (const [nome, n] of contagem.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))) {
    linhas.push(`  ${nome.padEnd(largura)}  ${n}`)
  }
  return linhas.join('\n')
}

try {
  process.stdout.write(`${main(process.argv.slice(2))}\n`)
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { conferir, gerar } from './lib/catalogo.mjs'

function main(argv) {
  const i = argv.indexOf('--raiz')
  const raiz = i === -1 ? join(dirname(fileURLToPath(import.meta.url)), '..') : argv[i + 1]
  const comando = argv[0]
  if (!raiz || !['gerar', 'conferir'].includes(comando)) throw new Error('uso: catalogo.mjs gerar|conferir [--raiz <pasta>]')
  if (comando === 'gerar') {
    const escritas = gerar({ raiz })
    return { saida: escritas.length ? escritas.map((a) => `gravado ${a}`).join('\n') : 'nada a gravar', codigo: 0 }
  }
  const diferencas = conferir({ raiz })
  if (!diferencas.length) return { saida: 'catálogo em dia', codigo: 0 }
  return { saida: [...diferencas, 'Rode: node scripts/catalogo.mjs gerar'].join('\n'), codigo: 1 }
}

try {
  const { saida, codigo } = main(process.argv.slice(2))
  process.stdout.write(`${saida}\n`)
  process.exitCode = codigo
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

#!/usr/bin/env node
import { loadPerfil } from './lib/perfil.mjs'
import { pastaRegistros, pastaEntrega, registrar, ler } from './lib/registros.mjs'

const USO = 'uso: registros.mjs registrar [--base <pasta>] <CHAVE|_geral> <decisao|abordagem|nota> <texto>\n     registros.mjs ler [--base <pasta>] <CHAVE>\n     registros.mjs pasta [--base <pasta>] [<CHAVE> [slug]]'

function separarBase(args) {
  const i = args.indexOf('--base')
  if (i === -1) return { base: null, resto: args }
  return { base: args[i + 1], resto: [...args.slice(0, i), ...args.slice(i + 2)] }
}

function main(argv) {
  const [comando, ...args] = argv
  const { base: baseInformada, resto } = separarBase(args)
  const base = baseInformada ?? pastaRegistros({ perfil: loadPerfil().perfil, cwd: process.cwd() })
  if (comando === 'registrar' && resto.length >= 3) {
    const [chave, tipo, ...texto] = resto
    return registrar({ base, chave, tipo, texto: texto.join(' ') })
  }
  if (comando === 'ler' && resto.length >= 1) return ler({ base, chave: resto[0] })
  if (comando === 'pasta') {
    const [chave, slug] = resto
    return chave ? pastaEntrega({ base, chave, slug }) : base
  }
  throw new Error(USO)
}

try {
  process.stdout.write(`${main(process.argv.slice(2))}\n`)
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

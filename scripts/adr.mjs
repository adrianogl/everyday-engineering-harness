#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { parseSecoes, checklist } from './lib/adr.mjs'

const USO = 'uso: adr.mjs secoes <arquivo.md>\n     adr.mjs checklist <arquivo.md>'

function main([comando, arquivo]) {
  if (!['secoes', 'checklist'].includes(comando) || !arquivo) throw new Error(USO)
  let texto
  try {
    texto = readFileSync(arquivo, 'utf8')
  } catch {
    throw new Error(`arquivo não encontrado: ${arquivo}`)
  }
  const secoes = parseSecoes(texto)
  return comando === 'secoes' ? JSON.stringify(secoes, null, 2) : checklist(secoes)
}

try {
  process.stdout.write(`${main(process.argv.slice(2))}\n`)
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { montarCard } from './lib/card.mjs'

const USO = 'uso: card.mjs montar <recorte.json> <pasta-saida>'

function main(argv) {
  const [comando, arquivo, saida] = argv
  if (comando !== 'montar' || !arquivo || !saida) throw new Error(USO)
  const card = montarCard(JSON.parse(readFileSync(arquivo, 'utf8')))
  mkdirSync(saida, { recursive: true })
  writeFileSync(join(saida, 'descricao.md'), card.descricao)
  writeFileSync(join(saida, 'comentario.md'), `${card.comentario}\n`)
  for (const anexo of card.anexos) writeFileSync(join(saida, anexo.nome), anexo.conteudo)
  return `card montado em ${saida}`
}

try {
  process.stdout.write(`${main(process.argv.slice(2))}\n`)
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

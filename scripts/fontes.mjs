#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { atualizarClone, diffOrigens, gravarStatusBusca, itensNovos, lerManifesto, pastaCache, registrarCommit, separarFontes, validarManifesto } from './lib/fontes.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const USO = 'uso: fontes.mjs buscar [--manifesto <arquivo>]\n     fontes.mjs diff [--manifesto <arquivo>]\n     fontes.mjs novos [--manifesto <arquivo>] [--triagem <arquivo>]\n     fontes.mjs registrar --peca <peca> --fonte <fonte> --caminho <caminho> --commit <sha> [--manifesto <arquivo>]'

function opcoes(args) {
  const o = {}
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith('--') || args[i + 1] === undefined) throw new Error(USO)
    o[args[i].slice(2)] = args[i + 1]
  }
  return o
}

function main(argv) {
  const [comando, ...args] = argv
  const o = opcoes(args)
  const arquivo = o.manifesto ?? join(raiz, 'fontes.json')
  const manifesto = lerManifesto(arquivo)
  const cache = pastaCache()
  if (['buscar', 'diff', 'novos'].includes(comando)) {
    const erros = validarManifesto(manifesto)
    if (erros.length > 0) throw new Error(`fontes.json inválido:\n${erros.join('\n')}`)
  }
  if (comando === 'buscar') {
    const fontes = {}
    for (const [fonte, { repo }] of Object.entries(manifesto.fontes ?? {})) {
      fontes[fonte] = atualizarClone({ fonte, repo, cache })
      gravarStatusBusca({ fonte, cache, resultado: fontes[fonte] })
    }
    return { cache, fontes }
  }
  if (comando === 'diff') {
    const { clones, desatualizadas } = separarFontes({ manifesto, cache })
    return [...diffOrigens({ manifesto, clones }), ...desatualizadas]
  }
  if (comando === 'novos') {
    const triagem = readFileSync(o.triagem ?? join(raiz, 'docs', 'triagem.tsv'), 'utf8')
    const { clones, desatualizadas } = separarFontes({ manifesto, cache })
    return [...itensNovos({ clones, triagem }), ...desatualizadas]
  }
  if (comando === 'registrar' && o.peca && o.fonte && o.caminho && o.commit) {
    const novo = registrarCommit(manifesto, { peca: o.peca, fonte: o.fonte, caminho: o.caminho, commit: o.commit })
    writeFileSync(arquivo, `${JSON.stringify(novo, null, 2)}\n`)
    return { ok: true, arquivo }
  }
  throw new Error(USO)
}

try {
  process.stdout.write(`${JSON.stringify(main(process.argv.slice(2)), null, 2)}\n`)
} catch (erro) {
  process.stderr.write(`${erro.message}\n`)
  process.exit(1)
}

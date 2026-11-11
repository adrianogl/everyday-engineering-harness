#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { atualizarClone, diffOrigens, gitPadrao, itensNovos, lerManifesto, pastaCache, registrarCommit, validarManifesto } from './lib/upstream.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const USO = 'uso: upstream.mjs buscar [--manifesto <arquivo>]\n     upstream.mjs diff [--manifesto <arquivo>]\n     upstream.mjs novos [--manifesto <arquivo>] [--triagem <arquivo>]\n     upstream.mjs registrar --peca <peca> --fonte <fonte> --caminho <caminho> --commit <sha> [--manifesto <arquivo>]'

function opcoes(args) {
  const o = {}
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith('--') || args[i + 1] === undefined) throw new Error(USO)
    o[args[i].slice(2)] = args[i + 1]
  }
  return o
}

function clonesDoCache(manifesto, cache) {
  const clones = {}
  for (const fonte of Object.keys(manifesto.fontes)) {
    const dir = join(cache, fonte)
    if (!existsSync(join(dir, '.git'))) continue
    const h = gitPadrao(['rev-parse', 'HEAD'], dir)
    if (h.status === 0) clones[fonte] = { dir, head: h.stdout.trim() }
  }
  return clones
}

function main(argv) {
  const [comando, ...args] = argv
  const o = opcoes(args)
  const arquivo = o.manifesto ?? join(raiz, 'upstream.json')
  const manifesto = lerManifesto(arquivo)
  const cache = pastaCache()
  if (comando === 'buscar') {
    const erros = validarManifesto(manifesto)
    const fontes = {}
    for (const [fonte, { repo }] of Object.entries(manifesto.fontes ?? {})) {
      fontes[fonte] = atualizarClone({ fonte, repo, cache })
    }
    return { cache, erros, fontes }
  }
  if (comando === 'diff') return diffOrigens({ manifesto, clones: clonesDoCache(manifesto, cache) })
  if (comando === 'novos') {
    const triagem = readFileSync(o.triagem ?? join(raiz, 'docs', 'triagem.tsv'), 'utf8')
    return itensNovos({ clones: clonesDoCache(manifesto, cache), triagem })
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

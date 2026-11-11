import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TIPOS = ['command', 'skill', 'agent']
const INICIO = '<!-- catalogo:inicio -->'
const FIM = '<!-- catalogo:fim -->'

function descricaoDe(texto, origem) {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) throw new Error(`${origem}: sem frontmatter`)
  const linha = m[1].split('\n').find((l) => l.startsWith('description:'))
  if (!linha) throw new Error(`${origem}: sem description`)
  let valor = linha.slice('description:'.length).trim()
  if (valor.length >= 2 && valor.startsWith('"') && valor.endsWith('"')) {
    valor = valor.slice(1, -1).replace(/\\"/g, '"')
  }
  return valor
}

function listar(pasta) {
  return existsSync(pasta) ? readdirSync(pasta, { withFileTypes: true }) : []
}

export function lerPecas({ raiz }) {
  const pecas = []
  for (const e of listar(join(raiz, 'commands'))) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue
    const arquivo = join(raiz, 'commands', e.name)
    pecas.push({ tipo: 'command', nome: e.name.slice(0, -3), descricao: descricaoDe(readFileSync(arquivo, 'utf8'), arquivo) })
  }
  for (const e of listar(join(raiz, 'skills'))) {
    const arquivo = join(raiz, 'skills', e.name, 'SKILL.md')
    if (!e.isDirectory() || !existsSync(arquivo)) continue
    pecas.push({ tipo: 'skill', nome: e.name, descricao: descricaoDe(readFileSync(arquivo, 'utf8'), arquivo) })
  }
  for (const e of listar(join(raiz, 'agents'))) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue
    const arquivo = join(raiz, 'agents', e.name)
    pecas.push({ tipo: 'agent', nome: e.name.slice(0, -3), descricao: descricaoDe(readFileSync(arquivo, 'utf8'), arquivo) })
  }
  return pecas.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nome.localeCompare(b.nome))
}

export function linhaCurta(descricao) {
  const fim = descricao.search(/\.(\s|$)/)
  let frase = fim === -1 ? descricao : descricao.slice(0, fim + 1)
  const uso = frase.indexOf(' Use ')
  if (uso !== -1) frase = frase.slice(0, uso)
  frase = frase.trim()
  return /\.$/.test(frase) || /[;:]$/.test(frase) ? frase : `${frase}.`
}

export function montarCatalogo({ raiz, en }) {
  const pecas = lerPecas({ raiz })
  const chaves = new Set(pecas.map((p) => `${p.tipo}/${p.nome}`))
  const semTraducao = [...chaves].filter((c) => !(c in en))
  const semPeca = Object.keys(en).filter((c) => !chaves.has(c))
  if (semTraducao.length || semPeca.length) {
    const partes = []
    if (semTraducao.length) partes.push(`peças sem entrada em en: ${semTraducao.join(', ')}`)
    if (semPeca.length) partes.push(`entradas de en sem peça: ${semPeca.join(', ')}`)
    throw new Error(partes.join('; '))
  }
  const contagem = { command: 0, skill: 0, agent: 0 }
  for (const p of pecas) contagem[p.tipo] += 1
  return {
    contagem,
    pecas: pecas.map((p) => ({ tipo: p.tipo, nome: p.nome, pt: linhaCurta(p.descricao), en: en[`${p.tipo}/${p.nome}`] })),
  }
}

const TITULOS = {
  en: { command: 'Commands', skill: 'Skills', agent: 'Agents', cabecalho: ['Name', 'What it does'] },
  pt: { command: 'Commands', skill: 'Skills', agent: 'Agents', cabecalho: ['Nome', 'O que faz'] },
}

export function blocoReadme(catalogo, idioma) {
  const t = TITULOS[idioma]
  if (!t) throw new Error(`idioma desconhecido: ${idioma}`)
  const linhas = [INICIO]
  for (const tipo of TIPOS) {
    const doTipo = catalogo.pecas.filter((p) => p.tipo === tipo)
    linhas.push('', `### ${t[tipo]} (${doTipo.length})`, '', `| ${t.cabecalho[0]} | ${t.cabecalho[1]} |`, '| --- | --- |')
    for (const p of doTipo) {
      const nome = tipo === 'command' ? `/eeh:${p.nome}` : p.nome
      linhas.push(`| \`${nome}\` | ${idioma === 'en' ? p.en : p.pt} |`)
    }
  }
  linhas.push('', FIM)
  return linhas.join('\n')
}

function substituirBloco(texto, bloco) {
  const i = texto.indexOf(INICIO)
  const f = texto.indexOf(FIM)
  if (i === -1 || f === -1 || f < i) return null
  return texto.slice(0, i) + bloco + texto.slice(f + FIM.length)
}

function lerCatalogo(raiz) {
  const en = JSON.parse(readFileSync(join(raiz, 'site', 'catalogo.en.json'), 'utf8'))
  return montarCatalogo({ raiz, en })
}

const READMES = [
  ['README.md', 'en'],
  ['README.pt-BR.md', 'pt'],
]

export function saidas({ raiz }) {
  const catalogo = lerCatalogo(raiz)
  const lista = [{ arquivo: 'site/catalogo.json', conteudo: `${JSON.stringify(catalogo, null, 2)}\n`, obrigatoria: true }]
  for (const [arquivo, idioma] of READMES) {
    const caminho = join(raiz, arquivo)
    if (!existsSync(caminho)) continue
    const novo = substituirBloco(readFileSync(caminho, 'utf8'), blocoReadme(catalogo, idioma))
    if (novo !== null) lista.push({ arquivo, conteudo: novo })
  }
  return lista
}

export function gerar({ raiz }) {
  const escritas = []
  for (const { arquivo, conteudo } of saidas({ raiz })) {
    const caminho = join(raiz, arquivo)
    const atual = existsSync(caminho) ? readFileSync(caminho, 'utf8') : null
    if (atual === conteudo) continue
    writeFileSync(caminho, conteudo)
    escritas.push(arquivo)
  }
  return escritas
}

export function conferir({ raiz }) {
  const diferencas = []
  for (const { arquivo, conteudo } of saidas({ raiz })) {
    const caminho = join(raiz, arquivo)
    if (!existsSync(caminho)) diferencas.push(`${arquivo}: não existe`)
    else if (readFileSync(caminho, 'utf8') !== conteudo) diferencas.push(`${arquivo}: desatualizado`)
  }
  return diferencas
}

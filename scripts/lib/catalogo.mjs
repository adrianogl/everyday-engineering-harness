import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROTEIRO, terminalSvg } from './terminal.mjs'

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

export const LIMITE_LINHA = 120

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
  const fim = descricao.search(/(?<!\b(?:e\.g|i\.e|ex))\.(\s|$)/)
  let frase = fim === -1 ? descricao : descricao.slice(0, fim + 1)
  const uso = frase.indexOf(' Use ')
  if (uso !== -1) frase = frase.slice(0, uso)
  frase = frase.trim()
  return /\.$/.test(frase) || /[;:]$/.test(frase) ? frase : `${frase}.`
}

export function montarCatalogo({ raiz, en, pt = {} }) {
  const pecas = lerPecas({ raiz })
  const chaves = new Set(pecas.map((p) => `${p.tipo}/${p.nome}`))
  const semTraducao = [...chaves].filter((c) => !(c in en))
  const semPeca = Object.keys(en).filter((c) => !chaves.has(c))
  const ptSemPeca = Object.keys(pt).filter((c) => !chaves.has(c))
  if (ptSemPeca.length) throw new Error(`entradas de pt sem peça: ${ptSemPeca.join(', ')}`)
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
    pecas: pecas.map((p) => ({ tipo: p.tipo, nome: p.nome, pt: pt[`${p.tipo}/${p.nome}`] ?? linhaCurta(p.descricao), en: en[`${p.tipo}/${p.nome}`] })),
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

function substituirBloco(texto, bloco, inicio = INICIO, fim = FIM) {
  const i = texto.indexOf(inicio)
  const f = texto.indexOf(fim)
  if (i === -1 || f === -1 || f < i) return null
  return texto.slice(0, i) + bloco + texto.slice(f + fim.length)
}

const SITE_CATALOGO = ['<!-- catalogo-site:inicio -->', '<!-- catalogo-site:fim -->']
const SITE_TERMINAL = ['<!-- terminal-site:inicio -->', '<!-- terminal-site:fim -->']

function html(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function blocoSiteCatalogo(catalogo) {
  const c = catalogo.contagem
  const linhas = [
    SITE_CATALOGO[0],
    `<p class="contagem"><span><b>${c.command}</b> commands</span><span><b>${c.skill}</b> skills</span><span><b>${c.agent}</b> agents</span></p>`,
    '<ul class="pecas">',
  ]
  for (const tipo of TIPOS) {
    for (const p of catalogo.pecas.filter((x) => x.tipo === tipo)) {
      const nome = tipo === 'command' ? `/eeh:${p.nome}` : p.nome
      linhas.push(`<li class="peca" data-tipo="${tipo}"><code>${html(nome)}</code><span class="tipo">${tipo}</span><span class="desc" data-pt="${html(p.pt)}">${html(p.en)}</span></li>`)
    }
  }
  linhas.push('</ul>', SITE_CATALOGO[1])
  return linhas.join('\n')
}

export function blocoSiteTerminal(roteiro = ROTEIRO) {
  const linhas = [SITE_TERMINAL[0]]
  for (const { tipo, texto } of roteiro) {
    if (tipo === 'pedido') {
      const citado = 'cotação'
      const marcado = html(texto).replace(citado, `<span class="citado">${citado}</span>`)
      linhas.push(`<div class="linha pedido"><span class="sinal">›</span><span class="texto">${marcado}</span></div>`)
    } else if (tipo === 'ok') {
      linhas.push(`<div class="linha ok"><span class="sinal">✓</span><span class="texto">${html(texto)}</span></div>`)
    } else {
      linhas.push(`<div class="linha parada"><span class="sinal">■</span><span class="texto">${html(texto)}</span></div>`)
    }
  }
  linhas.push(SITE_TERMINAL[1])
  return linhas.join('\n')
}

function lerCatalogo(raiz) {
  const en = JSON.parse(readFileSync(join(raiz, 'site', 'catalogo.en.json'), 'utf8'))
  const caminhoPt = join(raiz, 'site', 'catalogo.pt.json')
  const pt = existsSync(caminhoPt) ? JSON.parse(readFileSync(caminhoPt, 'utf8')) : {}
  return montarCatalogo({ raiz, en, pt })
}

const READMES = [
  ['README.md', 'en'],
  ['README.pt-BR.md', 'pt'],
]

export function saidas({ raiz }) {
  const catalogo = lerCatalogo(raiz)
  const lista = [{ arquivo: 'site/catalogo.json', conteudo: `${JSON.stringify(catalogo, null, 2)}\n`, obrigatoria: true }]
  lista.push({ arquivo: 'site/terminal.svg', conteudo: terminalSvg() })
  for (const [arquivo, idioma] of READMES) {
    const caminho = join(raiz, arquivo)
    if (!existsSync(caminho)) continue
    const novo = substituirBloco(readFileSync(caminho, 'utf8'), blocoReadme(catalogo, idioma))
    if (novo !== null) lista.push({ arquivo, conteudo: novo })
  }
  const pagina = join(raiz, 'site', 'index.html')
  if (existsSync(pagina)) {
    let texto = readFileSync(pagina, 'utf8')
    texto = substituirBloco(texto, blocoSiteCatalogo(catalogo), ...SITE_CATALOGO) ?? texto
    texto = substituirBloco(texto, blocoSiteTerminal(), ...SITE_TERMINAL) ?? texto
    lista.push({ arquivo: 'site/index.html', conteudo: texto })
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

const CLIENTES_SQL = new Set(['psql', 'mysql', 'mariadb', 'sqlite3', 'sqlcmd', 'usql', 'pgcli', 'mycli'])
const PREFIXOS = new Set(['sudo', 'env', 'command', 'time', 'nohup', 'nice', 'exec', 'xargs', 'doas'])
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash'])
const ALVOS_PERIGOSOS = new Set(['/', '/*', '~', '~/', '~/*', '$HOME', '${HOME}', '$HOME/', '$HOME/*', '${HOME}/*', '*', '.', '..', './*', '../*', '.*'])
const SQL_DESTRUTIVO = /\b(drop\s+(table|database|schema)|truncate)\b/i

function dividir(comando) {
  const segmentos = []
  let tokens = []
  let atual = ''
  let temToken = false
  let aspas = null
  const fecharToken = () => {
    if (temToken) tokens.push(atual)
    atual = ''
    temToken = false
  }
  const fecharSegmento = () => {
    fecharToken()
    if (tokens.length) segmentos.push(tokens)
    tokens = []
  }
  for (let i = 0; i < comando.length; i++) {
    const c = comando[i]
    if (aspas) {
      if (c === aspas) aspas = null
      else if (c === '\\' && aspas === '"' && i + 1 < comando.length) atual += comando[++i]
      else atual += c
      continue
    }
    if (c === "'" || c === '"') {
      aspas = c
      temToken = true
    } else if (c === '\\' && i + 1 < comando.length) {
      atual += comando[++i]
      temToken = true
    } else if (c === ' ' || c === '\t') {
      fecharToken()
    } else if (c === '\n' || c === ';' || c === '|' || c === '&' || c === '(' || c === ')') {
      fecharSegmento()
    } else {
      atual += c
      temToken = true
    }
  }
  fecharSegmento()
  return segmentos
}

function nomeBase(token) {
  return token.split('/').pop()
}

function removerPrefixos(tokens) {
  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) i++
    else if (PREFIXOS.has(nomeBase(t))) {
      const prefixo = nomeBase(t)
      i++
      while (i < tokens.length && tokens[i].startsWith('-')) {
        const opcao = tokens[i]
        i++
        if (prefixo === 'sudo' && (opcao === '-u' || opcao === '-g') && i < tokens.length) i++
      }
    } else break
  }
  return tokens.slice(i)
}

function temFlagCurta(args, letras) {
  return args.some((a) => /^-[A-Za-z]+$/.test(a) && [...a.slice(1)].some((l) => letras.includes(l)))
}

function avaliarRm(args) {
  const recursivo = args.includes('--recursive') || temFlagCurta(args, 'rR')
  if (!recursivo) return null
  const alvos = args.filter((a) => !a.startsWith('-'))
  if (alvos.some((a) => ALVOS_PERIGOSOS.has(a))) return 'rm recursivo em diretório raiz, home ou curinga apaga muito mais que o esperado'
  return null
}

function subcomandoGit(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-C' || args[i] === '-c') i++
    else if (!args[i].startsWith('-')) return { sub: args[i], resto: args.slice(i + 1) }
  }
  return null
}

function avaliarGit(args) {
  const g = subcomandoGit(args)
  if (!g) return null
  const { sub, resto } = g
  if (sub === 'push') {
    const forcado = resto.some((a) => a === '--force' || a.startsWith('--force-with-lease') || a === '--force-if-includes' || /^-[A-Za-z]*f[A-Za-z]*$/.test(a) || /^\+[^\s]/.test(a))
    if (forcado) return 'git push forçado pode sobrescrever commits no remoto'
  }
  if (sub === 'reset' && resto.includes('--hard')) return 'git reset --hard descarta alterações locais não commitadas'
  if (sub === 'clean' && (resto.includes('--force') || temFlagCurta(resto, 'f'))) return 'git clean -f apaga arquivos não rastreados sem volta'
  return null
}

function avaliarSegmento(tokens) {
  const limpos = removerPrefixos(tokens)
  if (!limpos.length) return null
  const comando = nomeBase(limpos[0])
  const args = limpos.slice(1)
  if (SHELLS.has(comando)) {
    const i = args.findIndex((a) => /^-[A-Za-z]*c$/.test(a))
    if (i !== -1 && args[i + 1]) return avaliarTexto(args[i + 1])
    return null
  }
  if (comando === 'eval') return avaliarTexto(args.join(' '))
  if (comando === 'rm') return avaliarRm(args)
  if (comando === 'git') return avaliarGit(args)
  const indiceSql = limpos.findIndex((t) => CLIENTES_SQL.has(nomeBase(t)))
  if (indiceSql !== -1 && SQL_DESTRUTIVO.test(limpos.slice(indiceSql + 1).join(' '))) {
    return 'comando SQL destrutivo (DROP ou TRUNCATE) apaga dados ou estrutura'
  }
  return null
}

const HEREDOC = /<<(-?)[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2[^\n]*\n([\s\S]*?)(?:\n[ \t]*\3[ \t]*(?=\n|$)|$)/g

function fimDaSubstituicao(texto, inicio) {
  let profundidade = 1
  let aspas = null
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i]
    if (aspas) {
      if (c === aspas) aspas = null
      else if (c === '\\' && aspas === '"') i++
      continue
    }
    if (c === "'" || c === '"') aspas = c
    else if (c === '\\') i++
    else if (c === '(') profundidade++
    else if (c === ')' && --profundidade === 0) return i
  }
  return texto.length
}

function substituicoes(texto) {
  const internos = []
  let simples = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (simples) {
      if (c === "'") simples = false
      continue
    }
    if (c === "'") simples = true
    else if (c === '\\') i++
    else if (c === '$' && texto[i + 1] === '(') {
      const fim = fimDaSubstituicao(texto, i + 2)
      internos.push(texto.slice(i + 2, fim))
      i = fim
    } else if (c === '`') {
      const fim = texto.indexOf('`', i + 1)
      const ate = fim === -1 ? texto.length : fim
      internos.push(texto.slice(i + 1, ate))
      i = ate
    }
  }
  return internos
}

function separarHeredocs(texto) {
  const corpos = []
  const resto = texto.replace(HEREDOC, (trecho, _traco, _aspas, _marca, corpo, deslocamento) => {
    const inicioLinha = texto.lastIndexOf('\n', deslocamento) + 1
    const linha = texto.slice(inicioLinha, deslocamento)
    const segmentos = dividir(linha)
    const ultimo = segmentos.length ? removerPrefixos(segmentos[segmentos.length - 1]) : []
    if (ultimo.length && SHELLS.has(nomeBase(ultimo[0]))) corpos.push(corpo)
    return trecho.slice(0, trecho.indexOf('\n'))
  })
  return { resto, corpos }
}

function avaliarTexto(comando) {
  const { resto, corpos } = separarHeredocs(comando)
  for (const interno of [...corpos, ...substituicoes(resto)]) {
    const motivo = avaliarTexto(interno)
    if (motivo) return motivo
  }
  for (const segmento of dividir(resto)) {
    const motivo = avaliarSegmento(segmento)
    if (motivo) return motivo
  }
  return null
}

export function avaliar(comando) {
  if (typeof comando !== 'string' || !comando.trim()) return { decisao: 'allow' }
  const motivo = avaliarTexto(comando)
  return motivo ? { decisao: 'ask', motivo } : { decisao: 'allow' }
}

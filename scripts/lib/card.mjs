const REPO = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/
const ORDENS = { antes: 'executar antes do deploy', depois: 'executar depois do deploy' }

function vazio(valor) {
  return typeof valor !== 'string' || valor.trim() === ''
}

function validar(r) {
  const faltando = []
  if (typeof r.repo !== 'string' || !REPO.test(r.repo)) faltando.push('repo')
  if (!Array.isArray(r.aceite) || r.aceite.length === 0 || r.aceite.some(vazio)) faltando.push('aceite')
  if (vazio(r.adr?.link)) faltando.push('adr.link')
  if (vazio(r.adr?.secao)) faltando.push('adr.secao')
  if (vazio(r.recorteAdr)) faltando.push('recorteAdr')
  if (r.sql) {
    if (vazio(r.sql.script)) faltando.push('sql.script')
    if (vazio(r.sql.banco)) faltando.push('sql.banco')
    if (vazio(r.sql.ambiente)) faltando.push('sql.ambiente')
    if (vazio(r.sql.ordem)) faltando.push('sql.ordem')
    else if (!Object.hasOwn(ORDENS, r.sql.ordem)) faltando.push(`sql.ordem (use ${Object.keys(ORDENS).join(' ou ')})`)
  }
  if (faltando.length > 0) throw new Error(`recorte inválido, campos faltando ou inválidos: ${faltando.join(', ')}`)
}

function secaoContrato({ contrato }) {
  if (vazio(contrato?.resumo)) return null
  return `## Contrato\n\n${contrato.resumo.trim()}`
}

function secaoSql({ repo, sql }) {
  if (!sql) return null
  const rollback = vazio(sql.rollback) ? 'sem rollback' : `rollback: anexo ${repo}-rollback.sql`
  return [
    '## SQL manual',
    '',
    `- banco: ${sql.banco}`,
    `- ambiente: ${sql.ambiente}`,
    `- ${ORDENS[sql.ordem]}`,
    `- script: anexo ${repo}.sql`,
    `- ${rollback}`,
  ].join('\n')
}

function secaoAceite({ aceite }) {
  return `## Critério de aceite\n\n${aceite.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
}

function secaoFigma({ figma }) {
  if (!figma || vazio(figma.link)) return null
  const linhas = ['## Figma', '', figma.link]
  if (figma.estados?.length > 0) linhas.push('', 'Estados:', ...figma.estados.map((e) => `- ${e}`))
  if (figma.copy?.length > 0) linhas.push('', 'Copy:', ...figma.copy.map((c) => `- ${c}`))
  return linhas.join('\n')
}

function secaoAdr({ adr }) {
  return ['## ADR', '', adr.link, '', `Seção: ${adr.secao}`].join('\n')
}

function montarAnexos({ repo, sql, contrato }) {
  const anexos = []
  if (sql) anexos.push({ nome: `${repo}.sql`, conteudo: sql.script })
  if (sql && !vazio(sql.rollback)) anexos.push({ nome: `${repo}-rollback.sql`, conteudo: sql.rollback })
  if (!vazio(contrato?.completo)) anexos.push({ nome: `${repo}-contrato.md`, conteudo: contrato.completo })
  return anexos
}

export function montarCard(recorte) {
  validar(recorte)
  const secoes = [secaoContrato(recorte), secaoSql(recorte), secaoAceite(recorte), secaoFigma(recorte), secaoAdr(recorte)].filter(Boolean)
  const titulo = `Recorte da ADR (${recorte.adr.secao})`
  return {
    descricao: `${secoes.join('\n\n')}\n`,
    anexos: montarAnexos(recorte),
    comentario: `${titulo}\n\n${recorte.recorteAdr.trim()}`,
  }
}

const CHAVE_IDIOMA = 'eeh-idioma'

function lerIdioma() {
  try {
    return localStorage.getItem(CHAVE_IDIOMA)
  } catch {
    return null
  }
}

function gravarIdioma(idioma) {
  try {
    localStorage.setItem(CHAVE_IDIOMA, idioma)
  } catch {}
}

function prepararDescricoes() {
  for (const el of document.querySelectorAll('.peca .desc')) el.dataset.en = el.textContent
}

function aplicarIdioma(textos, idioma) {
  const dicionario = textos[idioma]
  if (!dicionario) return
  document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en'
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const texto = dicionario[el.dataset.i18n]
    if (texto !== undefined) el.textContent = texto
  }
  for (const el of document.querySelectorAll('.peca .desc')) el.textContent = el.dataset[idioma]
  for (const botao of document.querySelectorAll('[data-lang]')) botao.setAttribute('aria-pressed', String(botao.dataset.lang === idioma))
}

async function iniciarIdioma() {
  prepararDescricoes()
  let textos
  try {
    const resposta = await fetch('i18n.json')
    textos = await resposta.json()
  } catch {
    return
  }
  const inicial = lerIdioma()
  if (inicial === 'pt') aplicarIdioma(textos, 'pt')
  for (const botao of document.querySelectorAll('[data-lang]')) {
    botao.addEventListener('click', () => {
      aplicarIdioma(textos, botao.dataset.lang)
      gravarIdioma(botao.dataset.lang)
    })
  }
}

function iniciarFiltro() {
  const filtro = document.querySelector('.filtro')
  if (!filtro) return
  filtro.hidden = false
  const botoes = filtro.querySelectorAll('[data-filtro]')
  for (const botao of botoes) {
    botao.addEventListener('click', () => {
      const tipo = botao.dataset.filtro
      for (const b of botoes) b.setAttribute('aria-pressed', String(b === botao))
      for (const peca of document.querySelectorAll('.peca')) peca.hidden = tipo !== 'todos' && peca.dataset.tipo !== tipo
    })
  }
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

async function animarTerminal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const linhas = [...document.querySelectorAll('#roteiro .linha')]
  if (!linhas.length) return
  const pedido = linhas[0].querySelector('.texto')
  const original = pedido.innerHTML
  const texto = pedido.textContent
  for (const l of linhas.slice(1)) l.classList.add('escondida')
  pedido.textContent = ''
  pedido.classList.add('cursor')
  await esperar(500)
  for (let i = 1; i <= texto.length; i += 1) {
    pedido.textContent = texto.slice(0, i)
    await esperar(45)
  }
  pedido.innerHTML = original
  pedido.classList.remove('cursor')
  for (const l of linhas.slice(1)) {
    await esperar(l.classList.contains('parada') ? 900 : 650)
    l.classList.remove('escondida')
  }
}

iniciarIdioma()
iniciarFiltro()
animarTerminal()

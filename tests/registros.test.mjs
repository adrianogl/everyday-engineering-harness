import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, existsSync, realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir, tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pastaRegistros, pastaEntrega, registrar, listarEntregas, ler } from '../scripts/lib/registros.mjs'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

function tmp() {
  return mkdtempSync(join(tmpdir(), 'eeh-reg-'))
}

test('usa registros do perfil', () => {
  const caminho = pastaRegistros({ perfil: { registros: '~/x' }, cwd: tmp() })
  assert.equal(caminho, join(homedir(), 'x'))
})

test('padrão é .eeh no pai do repo', () => {
  const ws = realpathSync(tmp())
  const repo = join(ws, 'ws', 'repo')
  mkdirSync(repo, { recursive: true })
  execFileSync('git', ['init', '-q'], { cwd: repo })
  mkdirSync(join(repo, 'src'))
  assert.equal(pastaRegistros({ perfil: null, cwd: join(repo, 'src') }), join(ws, 'ws', '.eeh'))
})

test('fora de git o padrão é .eeh no cwd', () => {
  const dir = tmp()
  assert.equal(pastaRegistros({ perfil: {}, cwd: dir }), join(dir, '.eeh'))
})

test('reutiliza pasta existente da chave', () => {
  const base = tmp()
  mkdirSync(join(base, 'PROJ-1-login'))
  assert.equal(pastaEntrega({ base, chave: 'PROJ-1' }), join(base, 'PROJ-1-login'))
})

test('monta a pasta com e sem slug', () => {
  const base = tmp()
  assert.equal(pastaEntrega({ base, chave: 'PROJ-2', slug: 'frete' }), join(base, 'PROJ-2-frete'))
  assert.equal(pastaEntrega({ base, chave: 'PROJ-3' }), join(base, 'PROJ-3'))
})

test('registrar cria arquivo e acrescenta entrada', () => {
  const base = tmp()
  const caminho = registrar({ base, chave: 'PROJ-1', tipo: 'decisao', texto: 'primeira', data: '2026-11-11' })
  registrar({ base, chave: 'PROJ-1', tipo: 'decisao', texto: 'segunda', data: '2026-11-11' })
  assert.equal(caminho, join(base, 'PROJ-1', 'decisoes.md'))
  const conteudo = readFileSync(caminho, 'utf8')
  assert.equal(conteudo.match(/## 2026-11-11/g).length, 2)
  assert.ok(conteudo.indexOf('primeira') < conteudo.indexOf('segunda'))
})

test('tipos gravam em arquivos próprios', () => {
  const base = tmp()
  assert.ok(registrar({ base, chave: 'PROJ-1', tipo: 'abordagem', texto: 'a' }).endsWith('abordagens.md'))
  assert.ok(registrar({ base, chave: 'PROJ-1', tipo: 'nota', texto: 'n' }).endsWith('notas.md'))
})

test('tipo inválido lança', () => {
  assert.throws(() => registrar({ base: tmp(), chave: 'PROJ-1', tipo: 'status', texto: 'x' }), Error)
})

test('chave inválida lança', () => {
  assert.throws(() => pastaEntrega({ base: tmp(), chave: '../fora' }), Error)
})

test('slug com separador ou ponto-ponto lança', () => {
  const base = tmp()
  for (const slug of ['../fora', 'a/b', '..', '.oculto', '']) {
    assert.throws(() => pastaEntrega({ base, chave: 'PROJ-1', slug }), Error, slug)
  }
  assert.throws(() => registrar({ base, chave: 'PROJ-1/../x', tipo: 'nota', texto: 'x' }), Error)
})

test('_geral grava em _geral/decisoes.md', () => {
  const base = tmp()
  const caminho = registrar({ base, chave: '_geral', tipo: 'decisao', texto: 'x' })
  assert.equal(caminho, join(base, '_geral', 'decisoes.md'))
  assert.ok(existsSync(caminho))
})

test('lista só pastas de entrega', () => {
  const base = tmp()
  mkdirSync(join(base, 'PROJ-2-b'))
  mkdirSync(join(base, 'PROJ-1-a'))
  mkdirSync(join(base, '_geral'))
  mkdirSync(join(base, 'outra'))
  assert.deepEqual(listarEntregas({ base }), ['PROJ-1-a', 'PROJ-2-b'])
  assert.deepEqual(listarEntregas({ base: join(base, 'nao-existe') }), [])
})

test('CLI registrar e pasta', () => {
  const base = tmp()
  const cli = join(raiz, 'scripts/registros.mjs')
  const env = { ...process.env, EEH_PERFIL: join(base, 'nao-existe.json') }
  const gravado = execFileSync('node', [cli, 'registrar', '--base', base, 'PROJ-9', 'decisao', 'usar cache'], { env, encoding: 'utf8' }).trim()
  assert.equal(gravado, join(base, 'PROJ-9', 'decisoes.md'))
  assert.match(readFileSync(gravado, 'utf8'), /usar cache/)
  const pasta = execFileSync('node', [cli, 'pasta', '--base', base, 'PROJ-9'], { env, encoding: 'utf8' }).trim()
  assert.equal(pasta, join(base, 'PROJ-9'))
})

test('ler devolve decisões, abordagens e notas da entrega', () => {
  const base = tmp()
  registrar({ base, chave: 'PROJ-4', tipo: 'decisao', texto: 'usar cache de 5 minutos', data: '2026-11-10' })
  registrar({ base, chave: 'PROJ-4', tipo: 'nota', texto: 'falar com o time de frete', data: '2026-11-11' })
  const saida = ler({ base, chave: 'PROJ-4' })
  assert.match(saida, /# decisoes\.md[\s\S]*## 2026-11-10[\s\S]*usar cache de 5 minutos/)
  assert.match(saida, /# notas\.md[\s\S]*falar com o time de frete/)
  assert.doesNotMatch(saida, /abordagens\.md/)
})

test('ler sem registros não lança', () => {
  assert.match(ler({ base: join(tmp(), 'nao-existe'), chave: 'PROJ-5' }), /Sem registros para PROJ-5/)
})

test('CLI ler imprime os registros', () => {
  const base = tmp()
  registrar({ base, chave: 'PROJ-6', tipo: 'decisao', texto: 'decidido', data: '2026-11-11' })
  const env = { ...process.env, EEH_PERFIL: join(base, 'nao-existe.json') }
  const saida = execFileSync('node', [join(raiz, 'scripts/registros.mjs'), 'ler', '--base', base, 'PROJ-6'], { env, encoding: 'utf8' })
  assert.match(saida, /decidido/)
})

test('CLI sem argumentos sai com erro', () => {
  assert.throws(() => execFileSync('node', [join(raiz, 'scripts/registros.mjs')], { stdio: 'pipe' }))
})

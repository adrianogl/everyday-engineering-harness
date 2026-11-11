import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scan } from '../scripts/lib/sanitize.mjs'

const arq = (conteudo, caminho = 'docs/a.md') => [{ caminho, conteudo }]

test('pega termo da denylist', () => {
  const achados = scan(arq('usa o AcmeCorp aqui'), ['acmecorp'])
  assert.equal(achados.length, 1)
  assert.equal(achados[0].regra, 'denylist')
  assert.equal(achados[0].linha, 1)
})

test('denylist casa palavra inteira', () => {
  const dl = ['ACME']
  assert.equal(scan(arq('time da ACME'), dl).length, 1)
  assert.equal(scan(arq('org ACME-TECH'), dl).length, 1)
  assert.equal(scan(arq('acmes'), dl).length, 0)
  assert.equal(scan(arq('PrecoPacmeSeguro'), dl).length, 0)
  assert.equal(scan(arq('pacmen'), dl).length, 0)
})

test('denylist casa termo dentro de composto com hifen', () => {
  assert.equal(scan(arq('acmefarma-backend'), ['acmefarma']).length, 1)
})

test('denylist casa termo com ponto inteiro', () => {
  assert.equal(scan(arq('fulano em acme.com.br hoje'), ['acme.com.br']).length, 1)
})

test('pega e-mail sem perfil', () => {
  const achados = scan(arq('contato: fulano@acmecorp.com.br'), [])
  assert.equal(achados.length, 1)
  assert.equal(achados[0].regra, 'email')
})

test('pega UUID', () => {
  const achados = scan(arq('\nid 1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'), [])
  assert.equal(achados.length, 1)
  assert.equal(achados[0].regra, 'uuid')
  assert.equal(achados[0].linha, 2)
})

test('pega accountId Atlassian', () => {
  const achados = scan(arq('123456:1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'), [])
  assert.equal(achados.length, 1)
  assert.equal(achados[0].regra, 'atlassian-account')
})

test('ignora placeholders', () => {
  const achados = scan(arq('seu-email@exemplo.com a@example.com 00000000-0000-0000-0000-000000000000'), [])
  assert.equal(achados.length, 0)
})

test('ignora o próprio arquivo de testes', () => {
  const achados = scan(arq('fulano@acmecorp.com.br', 'tests/sanitize.test.mjs'), ['acmecorp'])
  assert.equal(achados.length, 0)
})

test('scan pega termo em camelCase, snake, kebab e domínio', () => {
  for (const texto of ['AcmeService', 'ACME_TOKEN', 'acme-api', 'acme.dev', 'getAcmeToken', 'ACMEService', 'src/acme/x.go']) {
    assert.equal(scan(arq(texto), ['acme']).length, 1, texto)
  }
})

test('scan não pega termo dentro de palavra comum', () => {
  for (const texto of ['acmeologia', 'pacmeiro', 'Acmeologia', 'PrecoPacmeSeguro']) {
    assert.equal(scan(arq(texto), ['acme']).length, 0, texto)
  }
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('manifest declara o plugin eeh', () => {
  const m = JSON.parse(readFileSync('.claude-plugin/plugin.json', 'utf8'))
  assert.equal(m.name, 'eeh')
  assert.match(m.version, /^\d+\.\d+\.\d+$/)
  assert.equal(m.license, 'MIT')
})

test('marketplace aponta para o próprio repo', () => {
  const mk = JSON.parse(readFileSync('.claude-plugin/marketplace.json', 'utf8'))
  assert.equal(mk.plugins[0].name, 'eeh')
  assert.equal(mk.plugins[0].source, './')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { desenharIcone } from '../scripts/lib/icone.mjs'

function decodificar(png) {
  const largura = png.readUInt32BE(16)
  const altura = png.readUInt32BE(20)
  let offset = 8
  const idat = []
  while (offset < png.length) {
    const tamanho = png.readUInt32BE(offset)
    const tipo = png.toString('ascii', offset + 4, offset + 8)
    if (tipo === 'IDAT') idat.push(png.subarray(offset + 8, offset + 8 + tamanho))
    offset += 12 + tamanho
  }
  const cru = inflateSync(Buffer.concat(idat))
  const stride = largura * 4 + 1
  const pixel = (x, y) => [...cru.subarray(y * stride + 1 + x * 4, y * stride + 1 + x * 4 + 4)]
  return { largura, altura, pixel }
}

test('desenharIcone gera PNG válido com a assinatura e IHDR do tamanho pedido', () => {
  const png = desenharIcone(64)
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  assert.equal(png.toString('ascii', 12, 16), 'IHDR')
  assert.equal(png.readUInt32BE(16), 64)
  assert.equal(png.readUInt32BE(20), 64)
  assert.equal(png[24], 8)
  assert.equal(png[25], 6)
  assert.equal(png.toString('ascii', png.length - 8, png.length - 4), 'IEND')
})

test('pixel do centro da borda é #50fa7b e um pixel da letra é #282a36', () => {
  const { pixel, largura } = decodificar(desenharIcone(512))
  assert.deepEqual(pixel(largura / 2, 6), [0x50, 0xfa, 0x7b, 255])
  assert.equal(pixel(0, 0)[3], 0)
  const letra = new Set()
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const p = pixel(x, y)
    if (p[0] === 0x28 && p[1] === 0x2a && p[2] === 0x36 && p[3] === 255) letra.add(`${x},${y}`)
  }
  assert.ok(letra.size > 2000)
})

test('icon.png commitado é igual ao gerado', () => {
  assert.ok(readFileSync('.claude-plugin/icon.png').equals(desenharIcone(512)))
  assert.ok(readFileSync('site/favicon.png').equals(desenharIcone(64)))
})

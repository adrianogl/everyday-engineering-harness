import { deflateSync } from 'node:zlib'

const FUNDO = [0x50, 0xfa, 0x7b]
const LETRA = [0x28, 0x2a, 0x36]

const MATRIZ_E = [
  '..#####..',
  '.#######.',
  '###...###',
  '###...###',
  '#########',
  '#########',
  '###......',
  '###...###',
  '.#######.',
  '..#####..',
]

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(tipo, dados) {
  const cabecalho = Buffer.alloc(8)
  cabecalho.writeUInt32BE(dados.length, 0)
  cabecalho.write(tipo, 4, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([cabecalho.subarray(4), dados])), 0)
  return Buffer.concat([cabecalho, dados, crc])
}

function dentroDoQuadrado(x, y, tamanho, raio) {
  const cx = x + 0.5 < raio ? raio : x + 0.5 > tamanho - raio ? tamanho - raio : x + 0.5
  const cy = y + 0.5 < raio ? raio : y + 0.5 > tamanho - raio ? tamanho - raio : y + 0.5
  return (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= raio ** 2
}

export function desenharIcone(tamanho) {
  const raio = tamanho * 0.12
  const linhasMatriz = MATRIZ_E.length
  const colunasMatriz = MATRIZ_E[0].length
  const escala = Math.max(1, Math.floor((tamanho * 0.6) / linhasMatriz))
  const larguraLetra = colunasMatriz * escala
  const alturaLetra = linhasMatriz * escala
  const x0 = Math.floor((tamanho - larguraLetra) / 2)
  const y0 = Math.floor((tamanho - alturaLetra) / 2)

  const stride = tamanho * 4 + 1
  const cru = Buffer.alloc(stride * tamanho)
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const offset = y * stride + 1 + x * 4
      if (!dentroDoQuadrado(x, y, tamanho, raio)) continue
      const mx = Math.floor((x - x0) / escala)
      const my = Math.floor((y - y0) / escala)
      const naLetra = x >= x0 && y >= y0 && mx < colunasMatriz && my < linhasMatriz && MATRIZ_E[my][mx] === '#'
      const cor = naLetra ? LETRA : FUNDO
      cru[offset] = cor[0]
      cru[offset + 1] = cor[1]
      cru[offset + 2] = cor[2]
      cru[offset + 3] = 255
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(tamanho, 0)
  ihdr.writeUInt32BE(tamanho, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(cru, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ============================================================================
   GERA O "lanche de verdade" ESCRITO À MÃO DA ABERTURA DO APP
   ----------------------------------------------------------------------------
   Na abertura do app (celular), o slogan é escrito por um giz de cera, letra
   por letra (src/app/EscritaGiz.jsx). Pra isso o desenho precisa do
   CONTORNO exato das letras da Caveat — a mesma letra manuscrita do site —,
   não de um <text>: o giz percorre o contorno de cada letra, e uma máscara
   vai revelando a tinta por onde ele passa.

   Este script baixa a Caveat do Google Fonts, extrai as curvas das letras e
   grava em src/app/sloganManuscrito.js:
     d       o slogan inteiro (a TINTA — todas as curvas, com os furos)
     tracos  os contornos EXTERNOS de cada letra, na ordem da escrita (da
             esquerda pra direita). É o caminho que o giz faz. Os furos
             (o miolo do "a", do "e", do "d") ficam de fora: a faixa larga
             da máscara em volta do contorno de fora já cobre a tinta toda.

   Rodar:  node scripts/gerar-slogan-manuscrito.mjs
   Mudou o texto ou o peso? Troque aqui e rode de novo.
   ========================================================================== */

import fs from 'node:fs'
import opentype from 'opentype.js'

const FAMILIA = 'Caveat'
const PESO = 600
const TEXTO = 'lanche de verdade'
const TAMANHO = 1000
const SAIDA = 'src/app/sloganManuscrito.js'

// User-Agent antigo de propósito: pra navegador moderno o Google Fonts
// devolve WOFF2 (comprimido, o opentype.js não lê); pra um "velho", TTF.
const css = await (
  await fetch(`https://fonts.googleapis.com/css2?family=${FAMILIA}:wght@${PESO}`, {
    headers: { 'User-Agent': 'Mozilla/4.0' },
  })
).text()

const urlFonte = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1]
if (!urlFonte) {
  console.error('Não achei o TTF na resposta do Google Fonts:\n', css)
  process.exit(1)
}

const fonte = opentype.parse(await (await fetch(urlFonte)).arrayBuffer())
const escala = TAMANHO / fonte.unitsPerEm

/* Letra por letra (charToGlyph, sem o "shaping" do stringToGlyphs — ver o
   gerar-palavra-combo.mjs), com o kerning da fonte. */
const glifos = Array.from(TEXTO, (letra) => fonte.charToGlyph(letra))
const letras = []
let x = 0
let palavra = 0

glifos.forEach((glifo, i) => {
  if (TEXTO[i] === ' ') {
    palavra += 1
  } else {
    // quebra os comandos em contornos (cada M começa um)
    const contornos = []
    for (const c of glifo.getPath(x, 0, TAMANHO).commands) {
      if (c.type === 'M') contornos.push([c])
      else contornos.at(-1)?.push(c)
    }
    letras.push({ palavra, contornos })
  }
  const kern = i < glifos.length - 1 ? fonte.getKerningValue(glifo, glifos[i + 1]) : 0
  x += (glifo.advanceWidth + kern) * escala
})

const pontosDe = (c) =>
  [
    [c.x1, c.y1],
    [c.x2, c.y2],
    [c.x, c.y],
  ].filter(([px, py]) => px !== undefined && py !== undefined)

/* Área com sinal (fórmula do laço de sapato, com os pontos de controle
   junto — basta pro sinal). Contorno de fora e furo giram em sentidos
   opostos: o sinal separa um do outro. */
function areaDe(contorno) {
  const pts = contorno.flatMap(pontosDe)
  let soma = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    soma += x1 * y2 - x2 * y1
  }
  return soma / 2
}

// caixa exata da tinta
let x1 = Infinity
let y1 = Infinity
let x2 = -Infinity
let y2 = -Infinity
for (const { contornos } of letras) {
  for (const c of contornos.flat()) {
    for (const [px, py] of pontosDe(c)) {
      x1 = Math.min(x1, px)
      y1 = Math.min(y1, py)
      x2 = Math.max(x2, px)
      y2 = Math.max(y2, py)
    }
  }
}

const r = (n) => Math.round(n * 10) / 10
const serializar = (contorno) =>
  contorno
    .map((c) => {
      const p = (px, py) => `${r(px - x1)} ${r(py - y1)}`
      switch (c.type) {
        case 'M':
          return `M${p(c.x, c.y)}`
        case 'L':
          return `L${p(c.x, c.y)}`
        case 'Q':
          return `Q${p(c.x1, c.y1)} ${p(c.x, c.y)}`
        case 'C':
          return `C${p(c.x1, c.y1)} ${p(c.x2, c.y2)} ${p(c.x, c.y)}`
        case 'Z':
          return 'Z'
        default:
          throw new Error(`comando de path desconhecido: ${c.type}`)
      }
    })
    .join('')

const tinta = []
const tracos = []
for (const { palavra: p, contornos } of letras) {
  const areas = contornos.map(areaDe)
  // o maior contorno da letra é, com certeza, de fora; os que giram no
  // mesmo sentido dele também são de fora; os do sentido oposto são furos
  const maior = areas.reduce((m, a, i) => (Math.abs(a) > Math.abs(areas[m]) ? i : m), 0)
  const sinal = Math.sign(areas[maior])
  const externos = contornos
    .filter((_, i) => Math.sign(areas[i]) === sinal)
    // dentro da letra, da esquerda pra direita
    .sort((a, b) => Math.min(...a.flatMap(pontosDe).map(([px]) => px)) - Math.min(...b.flatMap(pontosDe).map(([px]) => px)))

  for (const contorno of contornos) tinta.push(serializar(contorno))
  for (const contorno of externos) tracos.push({ palavra: p, d: serializar(contorno) })
}

const largura = r(x2 - x1)
const altura = r(y2 - y1)

fs.writeFileSync(
  SAIDA,
  `/* GERADO por scripts/gerar-slogan-manuscrito.mjs — não edite à mão.
   "${TEXTO}" em ${FAMILIA} ${PESO}. largura/altura = caixa exata da tinta,
   em unidades do path. \`d\` é a tinta inteira; \`tracos\`, os contornos
   externos de cada letra na ordem da escrita (o caminho do giz), com o
   índice da palavra (a pausa entre palavras é maior). */
export const SLOGAN = {
  texto: '${TEXTO}',
  largura: ${largura},
  altura: ${altura},
  d: '${tinta.join('')}',
  tracos: ${JSON.stringify(tracos, null, 2).replace(/"(palavra|d)":/g, '$1:')},
}
`,
)

console.log(`ok → ${SAIDA}`)
console.log(`caixa: ${largura} × ${altura}  (proporção ${(largura / altura).toFixed(3)})`)
console.log(`${letras.length} letras, ${tracos.length} traços do giz`)

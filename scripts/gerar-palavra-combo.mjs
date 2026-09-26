/* ============================================================================
   GERA O "COMBO" VETORIAL DA HERO
   ----------------------------------------------------------------------------
   A palavra COMBO do burger da hero é desenhada com a MESMA fonte do título
   "LANCHE DE VERDADE." — Oswald Bold (700) — pra que as duas palavras sejam
   visivelmente da mesma família e do mesmo tom. Antes ela era um recorte do
   JPEG da logo (letras 3D, outra fonte, outro vermelho, borda serrilhada).

   Este script baixa a Oswald Bold do Google Fonts, extrai o CONTORNO exato
   das letras (não é imitação: são as curvas da própria fonte) e grava o
   resultado como um path SVG em src/components/burger/palavraCombo.js.

   Por que path e não <text> com a fonte:
   - não depende da fonte ter carregado — sem "piscar" em Arial no começo;
   - a caixa é exata (sabemos largura e altura das letras de antemão), o que
     a geometria do burger precisa pra empilhar as camadas.

   Rodar:  node scripts/gerar-palavra-combo.mjs
   Trocou a fonte do título? Troque FAMILIA/PESO aqui e rode de novo.
   ========================================================================== */

import fs from 'node:fs'
import opentype from 'opentype.js'

const FAMILIA = 'Oswald'
const PESO = 700
const TEXTO = 'COMBO'
// Mesmo letter-spacing do h1 (index.css: h1 { letter-spacing: -0.01em })
const TRACKING_EM = -0.01
const TAMANHO = 1000
const SAIDA = 'src/components/burger/palavraCombo.js'

// User-Agent antigo de propósito: pra navegador moderno o Google Fonts
// devolve WOFF2 (comprimido, o opentype.js não lê); pra um navegador
// "velho" ele devolve TTF.
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

/* Monta letra por letra pra aplicar o kerning da fonte E o tracking do
   título. (O getPath direto não deixa somar o tracking.) */
// charToGlyph, e não stringToGlyphs: o stringToGlyphs roda o "shaping"
// (substituições contextuais da fonte), e a Oswald tem uma regra que o
// opentype.js ainda não suporta — ele quebra. Pra cinco maiúsculas latinas
// o shaping não muda nada, então pegar letra por letra dá o mesmo resultado.
const glifos = Array.from(TEXTO, (letra) => fonte.charToGlyph(letra))
const comandos = []
let x = 0

glifos.forEach((glifo, i) => {
  comandos.push(...glifo.getPath(x, 0, TAMANHO).commands)
  const kern = i < glifos.length - 1 ? fonte.getKerningValue(glifo, glifos[i + 1]) : 0
  x += (glifo.advanceWidth + kern) * escala + TRACKING_EM * TAMANHO
})

// Caixa exata da tinta (só as letras, sem o espaço lateral da fonte)
let x1 = Infinity
let y1 = Infinity
let x2 = -Infinity
let y2 = -Infinity
const pontos = (c) =>
  [
    [c.x, c.y],
    [c.x1, c.y1],
    [c.x2, c.y2],
  ].filter(([px, py]) => px !== undefined && py !== undefined)

for (const c of comandos) {
  for (const [px, py] of pontos(c)) {
    x1 = Math.min(x1, px)
    y1 = Math.min(y1, py)
    x2 = Math.max(x2, px)
    y2 = Math.max(y2, py)
  }
}

// Leva a caixa pra origem (0,0) e serializa com 1 casa decimal
const r = (n) => Math.round(n * 10) / 10
const d = comandos
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

const largura = r(x2 - x1)
const altura = r(y2 - y1)

fs.writeFileSync(
  SAIDA,
  `/* GERADO por scripts/gerar-palavra-combo.mjs — não edite à mão.
   "${TEXTO}" em ${FAMILIA} ${PESO}, tracking ${TRACKING_EM}em (o mesmo do título
   da hero). largura/altura = caixa exata das letras, em unidades do path. */
export const PALAVRA_COMBO = {
  largura: ${largura},
  altura: ${altura},
  d: '${d}',
}
`,
)

console.log(`ok → ${SAIDA}`)
console.log(`caixa: ${largura} × ${altura}  (proporção ${(largura / altura).toFixed(3)})`)
console.log(`altura em % da largura da logo: ${((100 * altura) / largura).toFixed(2)}`)

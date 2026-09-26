import { CAMADAS, espessuraDa } from './camadas'
import { PALAVRA_COMBO } from './palavraCombo'

/* ============================================================================
   GEOMETRIA DO BURGER
   ----------------------------------------------------------------------------
   Posição das três peças da logo, em % da largura da logo inteira (a
   palavra COMBO = 100, a peça mais larga — como na logo de verdade).

   As peças são vetoriais (pecasLogo.jsx). Os pães mantêm EXATAMENTE a
   proporção das fatias do JPEG antigo da logo (o script que recortava as
   fatias foi aposentado junto com os PNGs — está em _backups, fora do
   repositório), então o formato do burger não mudou. O COMBO agora é o contorno da Oswald
   Bold (scripts/gerar-palavra-combo.mjs), mais baixo que as letras 3D da
   logo — a altura dele sai da proporção real da palavra gerada, não de
   número chutado.

   Tudo centralizado de verdade: as fatias do JPEG tinham um desvio de meio
   ponto herdado da foto da logo.
   ========================================================================== */

const PAO_TOPO = { largura: 81.36, altura: 36.02 }
const PAO_BASE = { largura: 90.25, altura: 14.83 }
const ALTURA_COMBO = (100 * PALAVRA_COMBO.altura) / PALAVRA_COMBO.largura
// respiro entre as peças com a logo montada (o mesmo da logo original)
const FOLGA_LOGO = 3.3

const centro = (largura) => (100 - largura) / 2
const topoCombo = PAO_TOPO.altura + FOLGA_LOGO
const topoBase = topoCombo + ALTURA_COMBO + FOLGA_LOGO

export const LOGO = {
  topo: { esquerda: centro(PAO_TOPO.largura), topo: 0, ...PAO_TOPO },
  combo: { esquerda: 0, topo: topoCombo, largura: 100, altura: ALTURA_COMBO },
  base: { esquerda: centro(PAO_BASE.largura), topo: topoBase, ...PAO_BASE },
  altura: topoBase + PAO_BASE.altura,
}

const ehLogo = (tipo) => tipo in LOGO && tipo !== 'altura'

/* Caixa (em % da largura da logo) que cada peça ocupa. Peças da logo usam
   a caixa do LOGO acima; camadas de recheio, a largura do catálogo
   (camadas.jsx) — todas centralizadas. */
export function caixaDa(tipo) {
  if (ehLogo(tipo)) {
    const { esquerda, largura, altura } = LOGO[tipo]
    return { esquerda, largura, altura }
  }

  const { largura } = CAMADAS[tipo]
  return { esquerda: (100 - largura) / 2, largura, altura: espessuraDa(tipo) }
}

// camadas encavaladas, como na vida real (o burger "fechado" do MiniBurger)
export const FOLGA_FECHADO = -0.8

// e afastadas (o burger "aberto" do MiniBurger — e da folha do produto no app)
export const FOLGA_ABERTO = 4

/* Altura do burger FECHADO com estas camadas, em % da largura dele (100 =
   tão alto quanto largo). Serve pra quem precisa encaixar o burger numa
   caixa de tamanho fixo — a miniatura do carrinho. */
export const alturaFechada = (camadas = []) => empilhar(['topo', ...camadas, 'base'], FOLGA_FECHADO).altura

/* Empilha as peças de cima pra baixo com `folga` entre elas. Folga negativa
   = camadas encavaladas (burger fechado, como na vida real); positiva =
   burger "explodido". Devolve o topo de cada peça e a altura total. */
export function empilhar(tipos, folga) {
  let y = 0

  const pecas = tipos.map((tipo, i) => {
    const caixa = caixaDa(tipo)
    const peca = { tipo, ...caixa, topo: y }
    y += caixa.altura + (i < tipos.length - 1 ? folga : 0)
    return peca
  })

  return { pecas, altura: y }
}

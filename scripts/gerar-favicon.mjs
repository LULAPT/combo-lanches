/* ============================================================================
   GERAR FAVICON — a logo vetorial virando o ícone da aba
   ----------------------------------------------------------------------------
   O ícone da aba não roda React, então não dá pra usar o <Logo>: este
   script monta a MESMA logo num SVG solto, em public/favicon.svg.

     node scripts/gerar-favicon.mjs

   Rode de novo se mudar o desenho de alguma peça. Os desenhos dos pães são
   cópia dos de src/components/burger/pecasLogo.jsx, e as posições saem das
   mesmas contas de src/components/burger/geometria.js (lá o arquivo importa
   JSX, que o Node puro não lê — por isso as contas estão repetidas aqui).

   As cores são fixas: um arquivo de ícone não enxerga as variáveis CSS do
   site. O vermelho é o --color-acento do tema escuro; o degradê do COMBO é
   o mesmo 90% com branco / 88% com preto do componente.
   ========================================================================== */
import fs from 'node:fs'
import { PALAVRA_COMBO } from '../src/components/burger/palavraCombo.js'

// ---- posições (as mesmas do geometria.js) ----
const PAO_TOPO = { largura: 81.36, altura: 36.02 }
const PAO_BASE = { largura: 90.25, altura: 14.83 }
const ALTURA_COMBO = (100 * PALAVRA_COMBO.altura) / PALAVRA_COMBO.largura
const FOLGA_LOGO = 3.3
const centro = (largura) => (100 - largura) / 2
const topoCombo = PAO_TOPO.altura + FOLGA_LOGO
const topoBase = topoCombo + ALTURA_COMBO + FOLGA_LOGO
const alturaLogo = topoBase + PAO_BASE.altura

const n = (v) => Math.round(v * 1000) / 1000

// ---- peças (os mesmos desenhos do pecasLogo.jsx) ----
const CONTORNO = '#b8930b'

const paoTopo = `
    <defs>
      <radialGradient id="tc" cx="0.36" cy="0.2" r="0.95"><stop offset="0" stop-color="#fffccb"/><stop offset="0.28" stop-color="#fef36a"/><stop offset="0.62" stop-color="#f9e43c"/><stop offset="1" stop-color="#e6c321"/></radialGradient>
      <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecce26"/><stop offset="1" stop-color="#c9a411"/></linearGradient>
      <radialGradient id="tr"><stop offset="0" stop-color="#fff" stop-opacity="0.65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <path d="M18 144 H366 Q380 144 379 155 Q378 166 364 166 H20 Q6 166 5 155 Q4 144 18 144 Z" fill="url(#tb)" stroke="${CONTORNO}" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M8 152 C8 64 88 6 192 6 C296 6 376 64 376 152 Q376 158 370 158 H14 Q8 158 8 152 Z" fill="url(#tc)" stroke="${CONTORNO}" stroke-opacity="0.45" stroke-width="2"/>
    <ellipse cx="124" cy="50" rx="78" ry="22" transform="rotate(-16 124 50)" fill="url(#tr)"/>
    <path d="M16 157 H368" stroke="${CONTORNO}" stroke-opacity="0.4" stroke-width="2"/>`

const paoBase = `
    <defs>
      <linearGradient id="bb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff9b8"/><stop offset="0.22" stop-color="#fdf25a"/><stop offset="0.62" stop-color="#f6e03c"/><stop offset="1" stop-color="#ddba1c"/></linearGradient>
    </defs>
    <rect x="4" y="5" width="418" height="58" rx="29" fill="url(#bb)" stroke="${CONTORNO}" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M34 16 Q213 7 392 16" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M30 55 Q213 65 396 55" fill="none" stroke="${CONTORNO}" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/>`

const combo = `
    <defs>
      <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9614b"/><stop offset="0.5" stop-color="#e64f37"/><stop offset="1" stop-color="#ca4530"/></linearGradient>
    </defs>
    <path d="${PALAVRA_COMBO.d}" fill="url(#cv)"/>`

// viewBox quadrado (ícone de aba é quadrado), com a logo centralizada na altura
const sobra = (100 - alturaLogo) / 2

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${n(-sobra)} 100 100">
  <svg x="${n(centro(PAO_TOPO.largura))}" y="0" width="${PAO_TOPO.largura}" height="${PAO_TOPO.altura}" viewBox="0 0 384 170" overflow="visible">${paoTopo}
  </svg>
  <svg x="0" y="${n(topoCombo)}" width="100" height="${n(ALTURA_COMBO)}" viewBox="0 0 ${PALAVRA_COMBO.largura} ${PALAVRA_COMBO.altura}">${combo}
  </svg>
  <svg x="${n(centro(PAO_BASE.largura))}" y="${n(topoBase)}" width="${PAO_BASE.largura}" height="${PAO_BASE.altura}" viewBox="0 0 426 70" overflow="visible">${paoBase}
  </svg>
</svg>
`

fs.writeFileSync('public/favicon.svg', svg)
console.log(`public/favicon.svg — ${svg.length} bytes`)

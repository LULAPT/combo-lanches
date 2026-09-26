import { useId } from 'react'
import { PALAVRA_COMBO } from './palavraCombo'

/* ============================================================================
   PEÇAS DA LOGO — em vetor
   ----------------------------------------------------------------------------
   Pão de cima, palavra COMBO e pão de baixo, redesenhados em SVG. Antes eram
   três fatias recortadas do JPEG da logo que veio do iFood: borda serrilhada
   (que o tema claro escancarava), e um COMBO com outra fonte e outro vermelho
   que o "VERDADE." do título.

   PÃES: o mesmo formato e o mesmo amarelo da logo, com volume desenhado —
   degradê de luz vindo de cima-esquerda, um reflexo suave e a "espessura"
   do pão (a faixa mais escura embaixo). Borda limpa em qualquer tamanho:
   eles aparecem gigantes na hero e minúsculos nos cards do cardápio.

   Cada viewBox tem EXATAMENTE a proporção da peça antiga (384×170 e 426×70),
   então a geometria do burger (geometria.js) continua valendo.

   COMBO: as letras são o contorno da própria Oswald Bold — a fonte do
   título —, gerado por scripts/gerar-palavra-combo.mjs. A cor é a variável
   do acento, a MESMA do "VERDADE.": as duas palavras mudam juntas de tom
   quando o tema troca.

   Cores via `style` (stopColor, fill) e não via atributo: atributo de SVG
   não aceita var(--...) nem color-mix().
   ========================================================================== */

const useIdSvg = () => useId().replace(/[^a-zA-Z0-9_-]/g, '')

// dourado do contorno e das sombras dos pães
const CONTORNO_PAO = '#b8930b'

export function PaoTopo({ className = 'block w-full overflow-visible' }) {
  const id = useIdSvg()

  return (
    <svg viewBox="0 0 384 170" className={className} aria-hidden="true">
      <defs>
        {/* luz de cima-esquerda: miolo quase branco, borda dourada */}
        <radialGradient id={`${id}cupula`} cx="0.36" cy="0.2" r="0.95">
          <stop offset="0" stopColor="#fffccb" />
          <stop offset="0.28" stopColor="#fef36a" />
          <stop offset="0.62" stopColor="#f9e43c" />
          <stop offset="1" stopColor="#e6c321" />
        </radialGradient>
        {/* a espessura do pão, vista por baixo da cúpula */}
        <linearGradient id={`${id}borda`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecce26" />
          <stop offset="1" stopColor="#c9a411" />
        </linearGradient>
        <radialGradient id={`${id}reflexo`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d="M18 144 H366 Q380 144 379 155 Q378 166 364 166 H20 Q6 166 5 155 Q4 144 18 144 Z"
        fill={`url(#${id}borda)`}
        stroke={CONTORNO_PAO}
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <path
        d="M8 152 C8 64 88 6 192 6 C296 6 376 64 376 152 Q376 158 370 158 H14 Q8 158 8 152 Z"
        fill={`url(#${id}cupula)`}
        stroke={CONTORNO_PAO}
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <ellipse
        cx="124"
        cy="50"
        rx="78"
        ry="22"
        transform="rotate(-16 124 50)"
        fill={`url(#${id}reflexo)`}
      />
      {/* sombra onde a cúpula encontra a espessura */}
      <path d="M16 157 H368" stroke={CONTORNO_PAO} strokeOpacity="0.4" strokeWidth="2" />
    </svg>
  )
}

export function PaoBase({ className = 'block w-full overflow-visible' }) {
  const id = useIdSvg()

  return (
    <svg viewBox="0 0 426 70" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff9b8" />
          <stop offset="0.22" stopColor="#fdf25a" />
          <stop offset="0.62" stopColor="#f6e03c" />
          <stop offset="1" stopColor="#ddba1c" />
        </linearGradient>
      </defs>

      <rect
        x="4"
        y="5"
        width="418"
        height="58"
        rx="29"
        fill={`url(#${id}base)`}
        stroke={CONTORNO_PAO}
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      {/* brilho em cima, sombra embaixo: é o que faz a barra parecer redonda */}
      <path d="M34 16 Q213 7 392 16" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 55 Q213 65 396 55" fill="none" stroke={CONTORNO_PAO} strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ----------------------------------------------------------------------------
   COMBO — com volume e brilho
   Duas camadas por cima do contorno das letras:

   VOLUME  degradê vertical: um pouco mais claro em cima, um pouco mais escuro
           embaixo, com o meio EXATAMENTE na cor do acento. Lembra o relevo
           das letras da logo sem sair do tom do "VERDADE.".

   BRILHO  o ShinyText do ReactBits, reescrito em SVG: o original pinta um
           degradê que corre por dentro de TEXTO HTML (background-clip:
           text), e aqui as letras são um desenho. Então uma faixa de luz
           inclinada atravessa um retângulo, e esse retângulo é recortado pelo
           contorno das letras (clipPath) — a luz só aparece DENTRO do COMBO.
           O movimento é CSS (.brilho-combo, no index.css): passa, some, e
           volta alguns segundos depois, como reflexo de vitrine.
           `brilho={false}` desliga: na logo pequena (nav, rodapé) um reflexo
           correndo a cada 5s seria só ruído no canto da tela.
-------------------------------------------------------------------------- */
export function PalavraCombo({ className = 'block w-full overflow-visible', brilho = true }) {
  const id = useIdSvg()
  const { largura: L, altura: A, d } = PALAVRA_COMBO

  return (
    <svg viewBox={`0 0 ${L} ${A}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}volume`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'color-mix(in oklab, var(--color-acento) 90%, white)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--color-acento)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in oklab, var(--color-acento) 88%, black)' }} />
        </linearGradient>
        <linearGradient id={`${id}luz`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}letras`}>
          <path d={d} />
        </clipPath>
      </defs>

      <path d={d} fill={`url(#${id}volume)`} />

      {brilho && (
        <g clipPath={`url(#${id}letras)`}>
          <rect
            className="brilho-combo"
            x={-0.5 * L}
            y={-0.3 * A}
            width={0.26 * L}
            height={1.6 * A}
            transform="skewX(-18)"
            fill={`url(#${id}luz)`}
            // percurso da faixa: da esquerda de fora até a direita de fora
            style={{ '--percurso': `${1.75 * L}px` }}
          />
        </g>
      )}
    </svg>
  )
}

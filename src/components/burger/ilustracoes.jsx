import { useId } from 'react'

/* ============================================================================
   ILUSTRAÇÕES — acompanhamentos e bebidas
   ----------------------------------------------------------------------------
   Desenhos chapados com um brilho só, no mesmo espírito das camadas do
   burger. Não use estes componentes direto: passe pelo <Ilustracao> (em
   src/components/Ilustracao.jsx), que sabe qual desenho e qual tamanho
   relativo cada item do cardápio usa.

   Quando chegarem fotos recortadas (PNG sem fundo) dos produtos, a troca é
   no mapa do Ilustracao.jsx — estes desenhos continuam de reserva.

   NENHUMA embalagem reproduz marca: são latas e garrafas genéricas na cor
   do sabor. Nada de logo da Coca-Cola, nada da garrafa com curvas (que é
   marca registrada deles também) — usar isso sem autorização é problema
   jurídico do cliente, não só nosso.

   `className` controla o tamanho. Padrão: largura cheia (a bandeja do Monte
   seu Combo posiciona por largura). O cardápio passa "h-full w-auto" pra
   dimensionar pela altura e alinhar todo mundo numa prateleira.

   Cada ilustração usa `useId` pelo mesmo motivo do Camada.jsx: degradês com
   id fixo colidiriam entre instâncias.
   ========================================================================== */

const PADRAO = 'block w-full overflow-visible'

const useIdSvg = () => useId().replace(/[^a-zA-Z0-9_-]/g, '')

/* A mini-logo (pão, barra, pão) carimbada na caixinha de batata. */
function MiniLogo({ x, y, escala = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <path d="M-11 0 A11 9 0 0 1 11 0 Z" fill="#fcf93a" />
      <rect x="-12" y="2.5" width="24" height="4.5" rx="1" fill="#f23522" stroke="#fcf93a" strokeWidth="0.6" />
      <rect x="-11" y="9" width="22" height="3.2" rx="1.6" fill="#fcf93a" />
    </g>
  )
}

/* ---------------------------------------------------------------------------
   ACOMPANHAMENTOS
-------------------------------------------------------------------------- */

export function Fritas({ completa = false, className = PADRAO }) {
  const id = useIdSvg()
  // palitos: [x, topo, inclinação]
  const palitos = [
    [30, 30, -8], [40, 18, -4], [50, 26, -2], [58, 12, 1], [66, 22, 3],
    [74, 14, 5], [83, 28, 7], [90, 20, 9], [46, 36, -6], [70, 34, 4],
  ]

  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="1" stopColor="#efae1c" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f23522" />
          <stop offset="1" stopColor="#b8190c" />
        </linearGradient>
      </defs>

      {palitos.map(([x, topo, giro], i) => (
        <rect
          key={i}
          x={x - 5}
          y={topo}
          width="10"
          height={80 - topo}
          rx="2.5"
          fill={`url(#${id}p)`}
          stroke="#d18a0d"
          strokeOpacity="0.5"
          transform={`rotate(${giro} ${x} 80)`}
        />
      ))}

      {/* batata completa: cobertura de cheddar escorrendo + pedacinhos de bacon */}
      {completa && (
        <>
          <path
            d="M24 52 Q34 40 48 46 Q60 36 74 44 Q88 38 98 50 L96 60 Q92 70 86 62 Q80 72 72 62 Q64 72 56 62 Q48 70 40 60 Q32 70 26 60 Z"
            fill="#f7a41c"
          />
          {[[40, 50], [58, 45], [76, 49], [88, 53], [50, 56]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="6" height="4" rx="1" fill="#8e2c16" transform={`rotate(${i * 23} ${x} ${y})`} />
          ))}
        </>
      )}

      <path d="M16 66 L104 66 L94 146 Q60 150 26 146 Z" fill={`url(#${id}c)`} />
      <path d="M16 66 Q60 88 104 66 L102 78 Q60 100 18 78 Z" fill="#000" opacity="0.18" />
      <path d="M22 72 L30 142" stroke="#fff" strokeOpacity="0.22" strokeWidth="5" strokeLinecap="round" />
      <MiniLogo x={60} y={112} escala={1.25} />
    </svg>
  )
}

export function Coxinha({ className = PADRAO }) {
  const id = useIdSvg()
  return (
    <svg viewBox="0 0 110 130" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="0.38" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f2b75c" />
          <stop offset="0.7" stopColor="#cf8431" />
          <stop offset="1" stopColor="#9c5717" />
        </radialGradient>
      </defs>
      <path
        d="M55 8 C62 30 98 56 98 88 C98 112 78 126 55 126 C32 126 12 112 12 88 C12 56 48 30 55 8 Z"
        fill={`url(#${id})`}
      />
      {/* farinha de rosca: pintinhas claras e escuras */}
      {Array.from({ length: 26 }, (_, i) => (
        <circle
          key={i}
          cx={24 + ((i * 37) % 62)}
          cy={48 + ((i * 53) % 70)}
          r={i % 3 === 0 ? 1.6 : 1}
          fill={i % 2 ? '#7a3f0c' : '#ffd79a'}
          opacity="0.55"
        />
      ))}
      <path d="M40 40 Q30 64 30 88" stroke="#fff" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function MiniPizza({ className = PADRAO }) {
  const id = useIdSvg()
  return (
    <svg viewBox="0 0 130 92" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="1" stopColor="#f5b73a" />
        </radialGradient>
      </defs>
      <ellipse cx="65" cy="54" rx="62" ry="34" fill="#a8621f" />
      <ellipse cx="65" cy="48" rx="62" ry="34" fill="#dc9a4f" />
      <ellipse cx="65" cy="47" rx="52" ry="27" fill={`url(#${id})`} />
      {[[44, 40], [78, 36], [60, 56], [90, 52], [38, 56], [66, 30]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="8.5" ry="5.5" fill="#c62f1d" />
          <ellipse cx={x - 2} cy={y - 1.8} rx="3.5" ry="1.4" fill="#fff" opacity="0.3" />
        </g>
      ))}
      {[[52, 46], [72, 44], [84, 40], [48, 32], [74, 58]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#3f7d21" />
      ))}
    </svg>
  )
}

export function Bolo({ className = PADRAO }) {
  return (
    <svg viewBox="0 0 130 112" className={className} aria-hidden="true">
      {/* face lateral: massa, recheio, massa */}
      <path d="M10 44 L100 26 L100 94 L10 104 Z" fill="#f2cf95" />
      <path d="M10 64 L100 50 L100 60 L10 75 Z" fill="#6b3218" />
      <path d="M10 86 L100 74 L100 82 L10 95 Z" fill="#6b3218" />
      {/* frente (o corte) */}
      <path d="M100 26 L122 38 L122 102 L100 94 Z" fill="#e2b877" />
      {/* cobertura por cima, escorrendo */}
      <path
        d="M8 42 L100 22 L124 36 L124 44 Q118 52 114 44 L100 36 Q92 48 86 38 Q70 50 64 42 Q48 56 42 46 Q28 58 22 50 Q14 58 8 50 Z"
        fill="#4c2311"
      />
      <circle cx="76" cy="20" r="7" fill="#e3241b" />
      <circle cx="74" cy="18" r="2" fill="#fff" opacity="0.5" />
      <path d="M76 13 Q80 4 88 2" stroke="#3f7d21" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   BEBIDAS
-------------------------------------------------------------------------- */

export function Lata({ cor = '#d9241c', faixa = '#ffffff', className = PADRAO }) {
  const id = useIdSvg()
  return (
    <svg viewBox="0 0 70 132" className={className} aria-hidden="true">
      <defs>
        {/* degradê horizontal: é o que faz o cilindro parecer redondo */}
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={cor} stopOpacity="0.75" />
          <stop offset="0.3" stopColor={cor} />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.62" stopColor={cor} />
          <stop offset="1" stopColor={cor} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="58" height="110" rx="9" fill={cor} />
      <rect x="6" y="14" width="58" height="110" rx="9" fill={`url(#${id})`} />
      <path d="M6 64 Q35 54 64 64 L64 80 Q35 70 6 80 Z" fill={faixa} opacity="0.9" />
      <ellipse cx="35" cy="14" rx="29" ry="6" fill="#cfcfcf" />
      <ellipse cx="35" cy="13" rx="23" ry="4" fill="#a9a9a9" />
      <rect x="29" y="9" width="12" height="4" rx="2" fill="#e6e6e6" />
    </svg>
  )
}

/* Garrafinha de vidro de 200ml. Reta de propósito — a garrafa com curvas
   é desenho registrado da Coca-Cola. */
export function Garrafinha({ cor = '#d9241c', liquido = '#3a170b', className = PADRAO }) {
  const id = useIdSvg()
  return (
    <svg viewBox="0 0 44 132" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.28" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* tampinha */}
      <rect x="14" y="2" width="16" height="8" rx="1.5" fill={cor} />
      <path d="M15 10 H29" stroke="#000" strokeOpacity="0.25" />
      {/* vidro com o líquido */}
      <path
        d="M16 10 L28 10 L28 30 Q36 40 36 54 L36 122 Q36 128 30 128 L14 128 Q8 128 8 122 L8 54 Q8 40 16 30 Z"
        fill={liquido}
      />
      {/* espaço de ar no gargalo */}
      <path d="M16 10 L28 10 L28 24 L16 24 Z" fill="#fff" opacity="0.18" />
      {/* rótulo */}
      <rect x="8" y="72" width="28" height="30" fill={cor} />
      <path d="M8 84 Q22 78 36 84 L36 90 Q22 84 8 90 Z" fill="#fff" opacity="0.85" />
      {/* brilho do vidro */}
      <path
        d="M16 10 L28 10 L28 30 Q36 40 36 54 L36 122 Q36 128 30 128 L14 128 Q8 128 8 122 L8 54 Q8 40 16 30 Z"
        fill={`url(#${id})`}
      />
    </svg>
  )
}

/* Garrafa PET — `litros` muda a proporção: a de 2L é mais alta E mais
   larga, como na vida real. */
export function Pet({ cor = '#d9241c', liquido = '#3a170b', tampa, litros = 1, className = PADRAO }) {
  const id = useIdSvg()
  const altura = litros >= 2 ? 190 : litros >= 1 ? 160 : 124
  const largura = litros >= 2 ? 52 : litros >= 1 ? 44 : 36
  const m = largura / 2
  const cx = 30
  const corpo = `M${cx - 6} 16 L${cx + 6} 16 L${cx + 6} 24 C${cx + 6} 34 ${cx + m} 36 ${cx + m} 50 L${cx + m} ${altura - 10} Q${cx + m} ${altura - 2} ${cx + m - 6} ${altura - 2} L${cx - m + 6} ${altura - 2} Q${cx - m} ${altura - 2} ${cx - m} ${altura - 10} L${cx - m} 50 C${cx - m} 36 ${cx - 6} 34 ${cx - 6} 24 Z`
  const rotuloY = altura * 0.42

  return (
    <svg viewBox={`0 0 60 ${altura}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {/* tampa + anel */}
      <rect x={cx - 7} y="2" width="14" height="10" rx="2" fill={tampa ?? cor} />
      <rect x={cx - 8} y="12" width="16" height="3" rx="1" fill="#d7d7d7" />
      {/* garrafa com líquido */}
      <path d={corpo} fill={liquido} />
      {/* ar no pescoço */}
      <path d={`M${cx - 6} 16 L${cx + 6} 16 L${cx + 6} 30 L${cx - 6} 30 Z`} fill="#fff" opacity="0.22" />
      {/* rótulo */}
      <rect x={cx - m} y={rotuloY} width={largura} height={altura * 0.2} fill={cor} />
      <path
        d={`M${cx - m} ${rotuloY + altura * 0.08} Q${cx} ${rotuloY + altura * 0.04} ${cx + m} ${rotuloY + altura * 0.08} L${cx + m} ${rotuloY + altura * 0.12} Q${cx} ${rotuloY + altura * 0.08} ${cx - m} ${rotuloY + altura * 0.12} Z`}
        fill="#fff"
        opacity="0.85"
      />
      {/* gomos do ombro */}
      <path d={`M${cx - m + 5} 44 Q${cx} 40 ${cx + m - 5} 44`} stroke="#fff" strokeOpacity="0.25" fill="none" />
      {/* brilho do plástico por cima de tudo */}
      <path d={corpo} fill={`url(#${id})`} />
    </svg>
  )
}

export function CopoSuco({ className = PADRAO }) {
  return (
    <svg viewBox="0 0 84 132" className={className} aria-hidden="true">
      <path d="M52 2 L46 60" stroke="#f23522" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 2 L49 28" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 6" />
      <path d="M10 22 L74 22 L66 126 Q42 130 18 126 Z" fill="rgb(255 255 255 / 0.25)" stroke="rgb(255 255 255 / 0.5)" />
      <path d="M13 44 L71 44 L66 126 Q42 130 18 126 Z" fill="#ff9a1f" />
      <path d="M13 44 Q42 50 71 44" fill="none" stroke="#ffc15a" strokeWidth="2" />
      <path d="M20 50 L24 118" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
      {/* rodela de laranja na borda */}
      <circle cx="70" cy="24" r="13" fill="#ffae2b" />
      <circle cx="70" cy="24" r="10" fill="#ffd27a" />
      <path d="M70 14 V34 M60 24 H80 M63 17 L77 31 M77 17 L63 31" stroke="#ffae2b" strokeWidth="1.2" />
    </svg>
  )
}

/* Água mineral. `gas` desenha as bolhinhas subindo (água com gás). */
export function Garrafa({ gas = false, className = PADRAO }) {
  return (
    <svg viewBox="0 0 60 142" className={className} aria-hidden="true">
      <rect x="21" y="2" width="18" height="12" rx="3" fill={gas ? '#1d9a6c' : '#2f6fd6'} />
      <path
        d="M22 14 L38 14 L38 26 Q52 34 52 50 L52 130 Q52 138 44 138 L16 138 Q8 138 8 130 L8 50 Q8 34 22 26 Z"
        fill="rgb(160 210 255 / 0.45)"
        stroke="rgb(200 230 255 / 0.8)"
      />
      <path d="M8 74 L52 74 L52 104 L8 104 Z" fill={gas ? '#1d9a6c' : '#2f6fd6'} opacity="0.9" />
      <path d="M8 88 Q30 80 52 88" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />
      {gas &&
        [[20, 120, 2.2], [34, 112, 1.6], [42, 126, 2], [26, 58, 1.8], [38, 64, 1.3], [30, 46, 1.5], [44, 50, 1.1]].map(
          ([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="0.9" />
          ),
        )}
      <path d="M15 44 L15 126" stroke="#fff" strokeOpacity="0.5" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

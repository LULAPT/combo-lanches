import { useId, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   CONTORNO A GIZ — a opção escolhida, circulada à mão
   ----------------------------------------------------------------------------
   O "selecionado" das etapas do Monte seu combo: em vez de um aro certinho,
   um traço de giz de cera que SE DESENHA em volta do cartão, como alguém
   circulando a escolha no cardápio com uma canetinha. Sem o giz aparecendo
   (pedido do Marco) — só o traço e a animação.

   O TRAÇO É SORTEADO a cada seleção (caminhoMaoLivre, lá embaixo): um
   retângulo de cantos redondos que ondula um tico, começa no meio da borda
   de cima e, no fim da volta, PASSA do ponto de partida um pouco por fora —
   caneta de verdade não fecha certinho.

   A TEXTURA é a mesma do "lanche de verdade" da abertura (EscritaGiz.jsx):
   um filtro SVG com a borda áspera (feDisplacementMap) e falhas onde a cera
   não pegou (feTurbulence virando transparência) — aqui nas medidas de um
   traço de 3px.

   Mede o cartão (o elemento pai) pra desenhar do tamanho exato dele — por
   offsetWidth/Height, que ignoram o "afundar" do toque (scale), senão o
   contorno nasceria 5% menor.
   Com menos movimento, o contorno aparece pronto, sem se desenhar.
   `raio`: o arredondamento do cartão (+ a folga) — 24 no combo, 20 nos
   ladrilhos de adicional da folha do lanche.
   ========================================================================== */

const FOLGA = 6 // px entre o cartão e o traço (o SVG vaza isso pra fora)
export default function ContornoGiz({ cor = 'var(--color-acento)', raio = 24 }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const svgRef = useRef(null)
  const menos = useMenosMovimento()
  const [desenho, setDesenho] = useState(null)

  useLayoutEffect(() => {
    const cartao = svgRef.current?.parentElement
    if (!cartao) return
    const w = cartao.offsetWidth + FOLGA * 2
    const h = cartao.offsetHeight + FOLGA * 2
    setDesenho({ w, h, d: caminhoMaoLivre(w, h, raio + FOLGA * 0.5) })
  }, [raio])

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute overflow-visible"
      style={{ top: -FOLGA, left: -FOLGA, width: `calc(100% + ${FOLGA * 2}px)`, height: `calc(100% + ${FOLGA * 2}px)` }}
    >
      <defs>
        <filter id={`${id}giz`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="7" result="ondas" />
          <feDisplacementMap in="SourceGraphic" in2="ondas" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="aspera" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="grao" />
          <feColorMatrix in="grao" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6 0 0 0 4.3" result="falhas" />
          <feComposite in="aspera" in2="falhas" operator="in" />
        </filter>
      </defs>

      {desenho && (
        <motion.path
          d={desenho.d}
          fill="none"
          style={{ stroke: cor }}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${id}giz)`}
          initial={menos ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ pathLength: { duration: 0.55, ease: [0.45, 0, 0.2, 1] }, opacity: { duration: 0.01 } }}
        />
      )}
    </svg>
  )
}

/* ---- O TRAÇO À MÃO ----
   Anda pelo contorno de um retângulo de cantos redondos (w × h, raio r, a
   3px da borda do SVG pra o traço não ser cortado), um ponto a cada ~6px.
   Cada ponto é empurrado pra fora/dentro por duas ondas lentas com fase
   sorteada (o traço ondula, não treme) e, depois de uma volta inteira, o
   caminho continua mais 11% abrindo pra fora: a "passada" do fim.
   Os pontos viram uma curva lisa (Catmull-Rom → Bézier cúbica). */
function caminhoMaoLivre(w, h, r) {
  const m = 3
  const lx = w - 2 * m - 2 * r // trecho reto de cima/baixo
  const ly = h - 2 * m - 2 * r // trecho reto dos lados
  const arco = (Math.PI / 2) * r
  const L = 2 * lx + 2 * ly + 4 * arco

  // ponto e normal (pra fora) a uma distância s do começo da borda de cima
  const naBorda = (s) => {
    s = ((s % L) + L) % L
    const cantos = [
      // [comprimento, função]
      [lx, (t) => ({ x: m + r + t, y: m, nx: 0, ny: -1 })],
      [arco, (t) => canto(w - m - r, m + r, -Math.PI / 2 + t / r)],
      [ly, (t) => ({ x: w - m, y: m + r + t, nx: 1, ny: 0 })],
      [arco, (t) => canto(w - m - r, h - m - r, t / r)],
      [lx, (t) => ({ x: w - m - r - t, y: h - m, nx: 0, ny: 1 })],
      [arco, (t) => canto(m + r, h - m - r, Math.PI / 2 + t / r)],
      [ly, (t) => ({ x: m, y: h - m - r - t, nx: -1, ny: 0 })],
      [arco, (t) => canto(m + r, m + r, Math.PI + t / r)],
    ]
    for (const [comprimento, f] of cantos) {
      if (s <= comprimento) return f(s)
      s -= comprimento
    }
    return cantos[0][1](0)
  }
  const canto = (cx, cy, a) => ({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) })

  // começa no meio da borda de cima, um pouco pra esquerda
  const inicio = lx * (0.3 + Math.random() * 0.2)
  const f1 = Math.random() * Math.PI * 2
  const f2 = Math.random() * Math.PI * 2
  const passada = L * 0.11
  const pontos = []
  for (let s = 0; s <= L + passada; s += 6) {
    const p = naBorda(inicio + s)
    const onda = Math.sin((s / L) * Math.PI * 2 * 2 + f1) * 1.1 + Math.sin((s / L) * Math.PI * 2 * 5 + f2) * 0.5
    // começa um tico pra dentro e termina abrindo pra fora
    const abre = s > L ? ((s - L) / passada) * 3.2 : 0
    const entra = s < 30 ? -1 * (1 - s / 30) : 0
    const k = onda + abre + entra
    pontos.push([p.x + p.nx * k, p.y + p.ny * k])
  }

  const n = (v) => v.toFixed(2)
  let d = `M${n(pontos[0][0])} ${n(pontos[0][1])}`
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] ?? pontos[i]
    const p1 = pontos[i]
    const p2 = pontos[i + 1]
    const p3 = pontos[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`
  }
  return d
}

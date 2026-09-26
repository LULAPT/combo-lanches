/* ============================================================================
   GERGELIM — sementes flutuando na hero
   ----------------------------------------------------------------------------
   A "poeira de farinha" da referência que você mandou, traduzida pra
   hamburgueria: sementes de gergelim de pão.

   Três truques de profundidade, todos baratos:
   1. Sementes "longe" (prof baixa) são menores, mais apagadas e borradas —
      profundidade de campo de câmera.
   2. Paralaxe: cada semente sobe `prof × 240px` ao longo da rolagem da hero
      (lendo a mesma --p que move o burger). As de perto sobem mais rápido.
   3. Deriva: três trajetórias de keyframe com durações diferentes, que
      nunca sincronizam — parece aleatório sem nenhum JS rodando.

   No tema claro o --color-gergelim vira quase preto: gergelim preto.

   A paralaxe usa a propriedade `translate` e a deriva usa `transform`,
   em elementos separados. Se as duas usassem `transform`, uma apagaria a
   outra — a mesma armadilha do parallax das .circle no Lidera360.
   ========================================================================== */

function gerarSementes(qtd, semente) {
  let s = semente
  const aleatorio = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }

  return Array.from({ length: qtd }, () => {
    const prof = 0.25 + aleatorio() * 0.95
    return {
      x: aleatorio() * 100,
      y: aleatorio() * 100,
      prof,
      tamanho: 5 + prof * 9,
      giro: Math.round(aleatorio() * 360),
      trajetoria: ['a', 'b', 'c'][Math.floor(aleatorio() * 3)],
      duracao: 7 + aleatorio() * 7,
      atraso: aleatorio() * 10,
    }
  })
}

// Gerado uma vez só, fora do componente: as sementes não mudam de lugar
// a cada render.
const SEMENTES = gerarSementes(28, 11)

export default function Gergelim({ pausado = false }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SEMENTES.map((s, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            translate: `0 calc(var(--p, 0) * ${Math.round(-s.prof * 240)}px)`,
            opacity: 0.25 + s.prof * 0.55,
            filter: s.prof < 0.55 ? 'blur(1.5px)' : undefined,
          }}
        >
          <span
            className="block"
            style={{
              animation: `deriva-${s.trajetoria} ${s.duracao.toFixed(1)}s ease-in-out ${(-s.atraso).toFixed(1)}s infinite`,
              // coberta pela seção seguinte, a hero continua "viva" por
              // baixo; pausar economiza bateria de quem já rolou
              animationPlayState: pausado ? 'paused' : 'running',
            }}
          >
            <svg
              width={s.tamanho}
              height={s.tamanho * 0.55}
              viewBox="0 0 20 11"
              style={{ rotate: `${s.giro}deg` }}
            >
              <path
                d="M0.5 5.5 Q5 0 12 1.2 Q19.5 3 19.5 5.5 Q19.5 8 12 9.8 Q5 11 0.5 5.5 Z"
                fill="var(--color-gergelim)"
              />
              <ellipse cx="9" cy="4" rx="4.5" ry="1.3" fill="rgb(255 255 255 / 0.35)" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  )
}

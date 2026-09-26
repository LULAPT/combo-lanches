import { useEffect, useId, useRef } from 'react'
import { animate } from 'motion/react'
import { SLOGAN } from '@/app/sloganManuscrito'

/* ============================================================================
   ESCRITA A GIZ — o "lanche de verdade" da abertura do app
   ----------------------------------------------------------------------------
   O slogan se escreve sozinho, letra por letra, com textura de giz de cera,
   embaixo da logo que se monta. Só na abertura do app (celular); no resto
   do site a Caveat é texto normal.

   (Já teve um giz desenhado, com a ponta seguindo a escrita. Saiu, a
   pedido do Marco: ficou só a escrita.)

   COMO FUNCIONA (tudo num <svg>, nas unidades do slogan — ver o
   scripts/gerar-slogan-manuscrito.mjs, que extraiu as letras da Caveat):

   1. A TINTA é o slogan inteiro (SLOGAN.d), no vermelho da casa, com um
      filtro de giz de cera: borda áspera (feDisplacementMap) e falhas onde
      a cera não pegou (feTurbulence virando furos de transparência).
   2. Uma MÁSCARA esconde a tinta. Dentro dela, o contorno de cada letra
      vira um traço branco LARGO (mais largo que a letra é grossa) que se
      desenha com stroke-dashoffset: por onde ele passa, a tinta aparece.
      Como o traço é largo e corre em volta da letra, ele cobre a tinta
      toda — a letra "surge" seguindo o próprio desenho dela.

   A velocidade é constante (unidades de contorno por segundo): letra
   comprida demora mais, como na mão. Entre uma letra e outra, uma pausa
   curtinha; entre palavras, maior. Ninguém re-renderiza durante a escrita
   — o `animate` da Motion escreve direto nos atributos do SVG.

   `aoTerminar`: avisa quando a última letra fecha (a abertura espera por
   isso pra seguir — AppCelular.jsx).
   ========================================================================== */

// espessura da faixa da máscara, em unidades do slogan: ~2,5× a grossura
// da letra (a faixa cobre metade pra dentro e metade pra fora do contorno)
const FAIXA = 240
// velocidade da escrita, em unidades de contorno por segundo
const VELOCIDADE = 32000
const PAUSA_LETRA = 0.022
const PAUSA_PALAVRA = 0.12

export default function EscritaGiz({ atraso = 0.6, aoTerminar, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const tracosRef = useRef([])
  const inteiraRef = useRef(null)
  // a última versão do callback, sem reiniciar a escrita se ele mudar
  const aoTerminarRef = useRef(aoTerminar)
  useEffect(() => {
    aoTerminarRef.current = aoTerminar
  }, [aoTerminar])

  useEffect(() => {
    const tracos = tracosRef.current
    const comprimentos = tracos.map((p) => p.getTotalLength())

    // tudo escondido: cada traço "tracejado" do tamanho dele, empurrado
    // pra fora
    tracos.forEach((p, i) => {
      p.style.strokeDasharray = `${comprimentos[i]} ${comprimentos[i]}`
      p.style.strokeDashoffset = `${comprimentos[i]}`
    })

    // a linha do tempo da escrita: quando cada letra começa e quanto dura
    let tempo = 0
    const agenda = SLOGAN.tracos.map((traco, i) => {
      if (i > 0) tempo += traco.palavra !== SLOGAN.tracos[i - 1].palavra ? PAUSA_PALAVRA : PAUSA_LETRA
      const inicio = tempo
      const duracao = comprimentos[i] / VELOCIDADE
      tempo += duracao
      return { inicio, duracao }
    })

    const escrita = animate(0, tempo, {
      delay: atraso,
      duration: tempo,
      ease: 'linear',
      onUpdate: (agora) => {
        agenda.forEach(({ inicio, duracao }, i) => {
          const fracao = Math.min(Math.max((agora - inicio) / duracao, 0), 1)
          tracos[i].style.strokeDashoffset = `${comprimentos[i] * (1 - fracao)}`
        })
      },
      onComplete: () => {
        // garante a tinta inteira: se a faixa deixou alguma lasca de fora,
        // ela aparece aqui, num fade curto
        inteiraRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'forwards' })
        aoTerminarRef.current?.()
      },
    })

    return () => escrita.stop()
  }, [atraso])

  return (
    <svg
      viewBox={`0 0 ${SLOGAN.largura} ${SLOGAN.altura}`}
      role="img"
      aria-label={SLOGAN.texto}
      className={`block w-full overflow-visible ${className}`}
    >
      <defs>
        {/* GIZ DE CERA: a borda treme (deslocamento por ruído) e a cera
            falha em pontinhos (ruído mais fino virando transparência).
            Frequências em unidades do slogan: ~30 unidades por pixel. */}
        <filter id={`${id}cera`} x="-3%" y="-15%" width="106%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4" result="ondas" />
          <feDisplacementMap in="SourceGraphic" in2="ondas" scale="34" xChannelSelector="R" yChannelSelector="G" result="aspera" />
          <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="1" seed="11" result="grao" />
          <feColorMatrix in="grao" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 0 0 0 5.9" result="falhas" />
          <feComposite in="aspera" in2="falhas" operator="in" />
        </filter>

        <mask id={`${id}escrita`} maskUnits="userSpaceOnUse" x="-300" y="-300" width={SLOGAN.largura + 600} height={SLOGAN.altura + 600}>
          {SLOGAN.tracos.map((traco, i) => (
            <path
              key={i}
              ref={(el) => {
                tracosRef.current[i] = el
              }}
              d={traco.d}
              fill="none"
              stroke="#fff"
              strokeWidth={FAIXA}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </mask>
      </defs>

      {/* a tinta revelada pela escrita… */}
      <g mask={`url(#${id}escrita)`}>
        <path d={SLOGAN.d} style={{ fill: 'var(--color-acento)' }} filter={`url(#${id}cera)`} />
      </g>
      {/* …e ela inteira, que aparece no fim (fecha qualquer lasca) */}
      <path ref={inteiraRef} d={SLOGAN.d} style={{ fill: 'var(--color-acento)', opacity: 0 }} filter={`url(#${id}cera)`} />
    </svg>
  )
}

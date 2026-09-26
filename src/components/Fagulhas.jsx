import { useEffect, useRef } from 'react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   FAGULHAS DO CLIQUE — o ClickSpark do ReactBits, reescrito
   ----------------------------------------------------------------------------
   Cada clique solta 8 riscos curtos saindo do ponto tocado: o "toda ação tem
   resposta visual imediata" da seção 06 do PDF, resolvido num lugar só.

   POR QUE NÃO O ClickSpark ORIGINAL (que ainda está em reactbits/)
   1. O laço de desenho dele NUNCA para: 60 vezes por segundo, pra sempre,
      ele apaga o canvas — com ou sem fagulha na tela. No celular isso é
      bateria indo embora parado.
   2. O canvas dele tinha o tamanho da PÁGINA INTEIRA (ele embrulhava o app
      todo): milhares de pixels de altura apagados a cada quadro.
   3. Por embrulhar o app, não dava pra desligá-lo no modo leve sem
      desmontar e remontar a página inteira.

   Aqui o canvas tem o tamanho da TELA (fixo), o laço só roda enquanto
   existe fagulha viva, e quem escuta o clique é a janela. Os números
   (8 riscos, 9px, raio 17, 420ms, ease-out) são os mesmos de antes.

   ONDE ELAS APARECEM: o canvas é posicionado e SEM z-index, montado antes
   do resto do app. É exatamente onde o ClickSpark desenhava: por cima do
   conteúdo comum (o cardápio), por baixo de tudo que tem z-index — as
   seções da landing, os cabeçalhos, os modais. Na landing elas nunca
   apareceram; se um dia quiser que apareçam, é dar um z-index aqui.
   ========================================================================== */

const QUANTIDADE = 8
const TAMANHO = 9
const RAIO = 17
const DURACAO = 420

const easeOut = (t) => t * (2 - t)

export default function Fagulhas({ cor }) {
  const canvasRef = useRef(null)
  const menos = useMenosMovimento()

  useEffect(() => {
    if (menos) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let fagulhas = []
    let quadro = 0

    // devicePixelRatio: sem ele, o risco de 2px fica borrado em tela retina
    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const desenhar = (agora) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.strokeStyle = cor
      ctx.lineWidth = 2

      fagulhas = fagulhas.filter((f) => {
        const passou = agora - f.inicio
        if (passou >= DURACAO) return false

        const e = easeOut(passou / DURACAO)
        const distancia = e * RAIO
        const comprimento = TAMANHO * (1 - e)
        const cos = Math.cos(f.angulo)
        const sen = Math.sin(f.angulo)

        ctx.beginPath()
        ctx.moveTo(f.x + distancia * cos, f.y + distancia * sen)
        ctx.lineTo(f.x + (distancia + comprimento) * cos, f.y + (distancia + comprimento) * sen)
        ctx.stroke()
        return true
      })

      // acabaram as fagulhas: o laço PARA (é isto que o original não fazia)
      quadro = fagulhas.length ? requestAnimationFrame(desenhar) : 0
    }

    const aoClicar = (e) => {
      // clique pelo teclado (Enter/Espaço num botão) vem com detail 0 e
      // posição 0,0 — as fagulhas estourariam no canto da tela
      if (e.detail === 0) return

      const agora = performance.now()
      for (let i = 0; i < QUANTIDADE; i++) {
        fagulhas.push({ x: e.clientX, y: e.clientY, angulo: (2 * Math.PI * i) / QUANTIDADE, inicio: agora })
      }
      if (!quadro) quadro = requestAnimationFrame(desenhar)
    }

    ajustar()
    window.addEventListener('resize', ajustar)
    window.addEventListener('click', aoClicar)

    return () => {
      window.removeEventListener('resize', ajustar)
      window.removeEventListener('click', aoClicar)
      cancelAnimationFrame(quadro)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [menos, cor])

  if (menos) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 size-full select-none"
    />
  )
}

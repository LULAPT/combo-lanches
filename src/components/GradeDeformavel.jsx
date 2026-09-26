import { useEffect, useRef } from 'react'
import { useMotionValueEvent } from 'motion/react'
import { useTema } from '@/context/TemaContext'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   GRADE DEFORMÁVEL — o fundo quadriculado da hero
   ----------------------------------------------------------------------------
   Uma grade reta que, no fim da rolagem da hero, é EMPURRADA pra fora pelo
   burger que está abrindo — como se a explosão das camadas deformasse o
   espaço em volta. No desktop ela também cede um pouco na direção do mouse.

   Canvas e não SVG: são ~40 linhas com ~80 pontos cada, recalculados a cada
   frame da rolagem. Em SVG isso seria reescrever 40 atributos `d` e deixar
   o navegador re-parsear tudo; no canvas é só redesenhar.

   SÓ DESENHA QUANDO ALGO MUDA. Não existe loop rodando parado: a grade
   redesenha quando a rolagem mexe no progresso, quando a tela muda de
   tamanho, quando o tema troca, ou enquanto o "puxão" do mouse está
   assentando. Parada, custa zero.

   O CAMPO DE DEFORMAÇÃO (o que empurra cada ponto da grade):
     inchaço   empurra radialmente pra longe do centro do burger, forte
               perto dele e sumindo com a distância (gaussiana)
     ondulação anéis de onda saindo do centro, como pedra na água
     mouse     puxa levemente os pontos perto do cursor
   Cor: --cor-grade (index.css), própria da grade — a --color-linha das
   bordas ficava apagada demais pra um fundo inteiro.

   A intensidade dos dois primeiros é `k`, que só começa a crescer depois
   de 45% da rolagem — a grade fica reta enquanto a logo está montada e
   "desforma no final", que foi o pedido.
   ========================================================================== */

const suave = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export default function GradeDeformavel({ progresso, centroRef, className = '' }) {
  const canvasRef = useRef(null)
  const agendarRef = useRef(() => {})
  const { tema } = useTema()
  // sistema OU interruptor: sem mouse deformando a grade (ver useMenosMovimento)
  const reduzido = useMenosMovimento()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    let L = 0
    let A = 0
    let pedido = 0
    let cor = 'rgba(255, 255, 255, 0.075)'

    // mouse: `alvo` é onde o cursor está, `atual` persegue com atraso — é o
    // que dá a sensação de elástico em vez de a grade grudar no cursor
    const mouse = { alvoX: 0, alvoY: 0, alvoForca: 0, x: 0, y: 0, forca: 0 }

    const lerCor = () => {
      cor = getComputedStyle(document.documentElement).getPropertyValue('--cor-grade').trim() || cor
    }

    const desenhar = () => {
      pedido = 0

      const p = progresso.get()
      const k = suave(0.45, 1, p)

      // assenta o mouse um passo; se ainda não chegou, pede outro frame
      mouse.x += (mouse.alvoX - mouse.x) * 0.16
      mouse.y += (mouse.alvoY - mouse.y) * 0.16
      mouse.forca += (mouse.alvoForca - mouse.forca) * 0.12
      const mouseAssentando =
        Math.abs(mouse.alvoX - mouse.x) > 0.5 ||
        Math.abs(mouse.alvoY - mouse.y) > 0.5 ||
        Math.abs(mouse.alvoForca - mouse.forca) > 0.01

      // centro da deformação = centro do burger, medido na tela
      let cx = L / 2
      let cy = A / 2
      const alvo = centroRef?.current
      if (alvo) {
        const caixaCanvas = canvas.getBoundingClientRect()
        const caixa = alvo.getBoundingClientRect()
        cx = caixa.left + caixa.width / 2 - caixaCanvas.left
        cy = caixa.top + caixa.height / 2 - caixaCanvas.top
      }

      const R = Math.min(L, A) * 0.42
      const passo = L < 768 ? 44 : 64

      const deformar = (x, y) => {
        let nx = x
        let ny = y

        if (k > 0) {
          const dx = x - cx
          const dy = y - cy
          const r = Math.hypot(dx, dy) + 0.001

          const inchaco = k * R * 0.34 * Math.exp(-((r / R) ** 2))
          const ondulacao = k * 11 * Math.sin(r / 34 - p * 16) * Math.exp(-r / (R * 2))
          const empurrao = inchaco + ondulacao

          nx += (dx / r) * empurrao
          // o burger abre na VERTICAL, então o empurrão vertical é maior
          ny += (dy / r) * empurrao * 1.35
        }

        if (mouse.forca > 0.01) {
          const mx = x - mouse.x
          const my = y - mouse.y
          const d2 = mx * mx + my * my
          const puxao = mouse.forca * 22 * Math.exp(-d2 / (130 * 130))
          const d = Math.sqrt(d2) + 0.001
          nx -= (mx / d) * puxao
          ny -= (my / d) * puxao
        }

        return [nx, ny]
      }

      ctx.clearRect(0, 0, L, A)
      ctx.strokeStyle = cor
      ctx.lineWidth = 1
      ctx.beginPath()

      // alinha a grade pra uma linha passar exatamente pelo centro do burger
      const x0 = (cx % passo) - passo
      const y0 = (cy % passo) - passo
      const resolucao = 12

      for (let gx = x0; gx <= L + passo; gx += passo) {
        for (let y = -passo, i = 0; y <= A + passo; y += resolucao, i++) {
          const [px, py] = deformar(gx, y)
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
      }
      for (let gy = y0; gy <= A + passo; gy += passo) {
        for (let x = -passo, i = 0; x <= L + passo; x += resolucao, i++) {
          const [px, py] = deformar(x, gy)
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
      }

      ctx.stroke()

      if (mouseAssentando) agendar()
    }

    const agendar = () => {
      if (!pedido) pedido = requestAnimationFrame(desenhar)
    }
    agendarRef.current = () => {
      lerCor()
      agendar()
    }

    // devicePixelRatio: sem isso, em tela retina a linha de 1px vira um
    // borrão de 2px esticado
    const redimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const caixa = canvas.getBoundingClientRect()
      L = caixa.width
      A = caixa.height
      canvas.width = Math.round(L * dpr)
      canvas.height = Math.round(A * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      agendar()
    }

    const aoMoverMouse = (e) => {
      const caixa = canvas.getBoundingClientRect()
      const dentro =
        e.clientX >= caixa.left &&
        e.clientX <= caixa.right &&
        e.clientY >= caixa.top &&
        e.clientY <= caixa.bottom

      mouse.alvoX = e.clientX - caixa.left
      mouse.alvoY = e.clientY - caixa.top
      mouse.alvoForca = dentro ? 1 : 0
      agendar()
    }

    lerCor()
    const observador = new ResizeObserver(redimensionar)
    observador.observe(canvas)

    if (temMouse && !reduzido) {
      window.addEventListener('pointermove', aoMoverMouse, { passive: true })
    }

    return () => {
      observador.disconnect()
      window.removeEventListener('pointermove', aoMoverMouse)
      cancelAnimationFrame(pedido)
    }
  }, [progresso, centroRef, reduzido])

  // tema trocou → a cor da linha mudou → redesenha
  useEffect(() => {
    agendarRef.current()
  }, [tema])

  useMotionValueEvent(progresso, 'change', () => agendarRef.current())

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}

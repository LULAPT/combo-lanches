import { motion, useScroll, useSpring } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   BARRA DE LEITURA — o fio de progresso do topo (o verde do Lidera360)
   ----------------------------------------------------------------------------
   Um fio de 2px colado no topo da tela que cresce da esquerda pra direita
   conforme a página rola: vazio no topo, cheio no fim. Mesma receita do
   Lidera — scaleX de 0 a 1, com origem na esquerda —, no vermelho da casa.

   Por que scaleX e não width: largura mexe no layout a cada pixel rolado;
   escala é só a placa de vídeo esticando uma faixa pronta. Não pesa nada.

   A mola (useSpring) segura os trancos da rolinha do mouse: a rolagem anda
   aos pulos, o fio anda liso. Quem pediu menos movimento recebe o fio sem
   mola, colado na rolagem.
   ========================================================================== */
export default function BarraLeitura() {
  const { scrollYProgress } = useScroll()
  const reduzido = useMenosMovimento()
  const suave = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.0005 })

  return (
    <motion.div
      aria-hidden="true"
      className="barra-leitura"
      style={{ scaleX: reduzido ? scrollYProgress : suave }}
    />
  )
}

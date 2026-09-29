import { useState } from 'react'
import { motion } from 'motion/react'

/* ============================================================================
   ADESIVO — o "verificado" das escolhas do app
   ----------------------------------------------------------------------------
   O par da escolha circulada a giz (ContornoGiz): vermelho de borda branca
   grossa, com brilho e sombra (.adesivo-selo no index.css), colado meio pra
   fora do canto de cima à direita do cartão escolhido. Entra "batendo" —
   grande e girando, assenta com um quique — logo depois de o contorno a
   giz começar a se desenhar.

   Cada vez que aparece, é colado de um jeito (pedido do Marco): a
   inclinação e o lugar são sorteados — torto entre -18° e +8°, e no canto
   de cima ou um tico mais pra baixo na borda direita, de leve. Sorteio no
   useState com função: uma vez por adesivo, não a cada render.

   Usado no Monte seu combo (✓) e nos adicionais do lanche (✓ ou a
   quantidade). O conteúdo vem de fora (children).
   ========================================================================== */
function sortear() {
  return {
    inclina: -18 + Math.random() * 26,
    topo: -8 + Math.random() * 16, // px: de 8px pra fora do canto até 8px pra dentro
    direita: -9 + Math.random() * 5, // px: sempre um pouco vazando pra fora
  }
}

export default function Adesivo({ children }) {
  const [{ inclina, topo, direita }] = useState(sortear)

  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 1.9, rotate: inclina - 35, opacity: 0 }}
      animate={{ scale: 1, rotate: inclina, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 16, delay: 0.22 }}
      className="adesivo-selo pointer-events-none absolute z-10 grid size-8 place-items-center overflow-hidden rounded-full
                 text-white"
      style={{ top: topo, right: direita }}
    >
      {children}
    </motion.span>
  )
}

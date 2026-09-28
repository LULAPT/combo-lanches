import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { Check, Motorbike } from 'lucide-react'
import { DURACAO_PEDIDO_MS, PASSOS_PEDIDO } from '@/data/pedido'
import { usePedido } from '@/context/PedidoContext'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   BOLINHA DO PEDIDO — a moto no canto superior direito
   ----------------------------------------------------------------------------
   Existe enquanto houver um pedido em andamento (PedidoContext). Diz "seu
   pedido está vindo" sem ocupar a tela — e um toque traz a janela de
   rastreio de volta (RastreioPedido).

     o anel     em volta da bolinha, enche com o andamento do pedido inteiro
                (de "recebido" até "entregue")
     o pulso    um anel que se abre e some, sem parar: "está acontecendo"
     a moto     balança de leve, andando. Entregue, vira um check.
     o aviso    quando o pedido muda de passo, o nome do passo novo
                ("Saiu pra entrega") escorrega pra fora da bolinha por uns
                segundos e volta pra dentro

   Nasce com o mesmo pop da bolha da sacola do site (BolhaCarrinho).
   A posição vem de fora (`className`): canto do site e canto do app são
   lugares diferentes.
   ========================================================================== */

const AVISO_MS = 3600

export default function BolhaPedido({ className = '' }) {
  const { pedido, passo, decorrido, entregue, abrirRastreio } = usePedido()
  const menos = useMenosMovimento()
  const tranco = useAnimationControls()
  const [aviso, setAviso] = useState(null)
  // o passo da última vez: só avisa quando ele MUDA com a bolinha na tela
  // (abrir o app no meio da entrega não dispara aviso nenhum)
  const anterior = useRef(pedido ? passo : null)

  useEffect(() => {
    if (!pedido) {
      anterior.current = null
      return
    }
    const mudou = anterior.current !== null && anterior.current !== passo
    anterior.current = passo
    if (!mudou) return

    tranco.start({ scale: [1, 1.22, 0.94, 1], transition: { duration: 0.5, ease: 'easeOut' } })
    setAviso(PASSOS_PEDIDO[passo].titulo)
    const id = setTimeout(() => setAviso(null), AVISO_MS)
    return () => clearTimeout(id)
  }, [pedido, passo, tranco])

  const progresso = Math.min(1, decorrido / DURACAO_PEDIDO_MS)
  const rotulo = pedido ? `Acompanhar pedido #${pedido.codigo}: ${PASSOS_PEDIDO[passo].titulo}` : ''

  return (
    <AnimatePresence>
      {pedido && (
        <motion.button
          key="bolha-pedido"
          type="button"
          onClick={abrirRastreio}
          aria-label={rotulo}
          title={rotulo}
          initial={{ scale: 0, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 520, damping: 16 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed z-[45] flex items-center ${className}`}
        >
          {/* o aviso do passo novo: escorrega pra ESQUERDA, pra fora da
              bolinha (ela está no canto direito da tela) */}
          <AnimatePresence>
            {aviso && (
              <motion.span
                key={aviso}
                aria-hidden="true"
                initial={{ opacity: 0, x: 24, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute right-[calc(100%+8px)] rounded-full bg-painel px-3.5 py-2 text-[12.5px] font-semibold
                           whitespace-nowrap text-texto shadow-(--sombra-flutuante) ring-1 ring-linha"
              >
                {aviso}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.span animate={tranco} className="relative grid size-12 place-items-center">
            {/* o anel do andamento */}
            <svg aria-hidden="true" viewBox="0 0 56 56" className="absolute -inset-1 size-14 -rotate-90">
              <circle cx="28" cy="28" r="26" fill="none" strokeWidth="3" className="stroke-linha" />
              <circle
                cx="28"
                cy="28"
                r="26"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                className="stroke-acento transition-[stroke-dashoffset] duration-1000 ease-linear"
                style={{ strokeDashoffset: 1 - progresso }}
              />
            </svg>

            <span
              className={`relative grid size-12 place-items-center rounded-full bg-botao text-white shadow-(--sombra-botao)
                          ${entregue ? '' : 'bolha-pedido-pulso'}`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {entregue ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  >
                    <Check size={22} strokeWidth={3} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moto"
                    exit={{ x: 30, opacity: 0 }}
                    // a moto "andando": um balanço curtinho, sem parar
                    animate={menos ? {} : { y: [0, -1.5, 0], rotate: [0, -3, 0] }}
                    transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Motorbike size={22} strokeWidth={2.2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

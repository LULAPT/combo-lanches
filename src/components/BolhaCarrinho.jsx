import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { useCarrinho } from '@/context/CarrinhoContext'

/* ============================================================================
   BOLHA DO CARRINHO — estilo iFood
   ----------------------------------------------------------------------------
   Só existe depois que o usuário coloca algo na sacola. Carrinho vazio não
   ocupa espaço na tela: um ícone permanente com "0" só ensina o usuário a
   ignorar aquele canto.

   Fica no canto superior esquerdo e é o ÚNICO acesso ao carrinho no site —
   por isso o trilho de vidro não tem sacola. Dois lugares pra mesma ação é
   o tipo de coisa que o checklist da seção 07 do PDF reprova ("os
   componentes usados já existem no sistema, evitando duplicidade?").
   (No celular é outra história: lá a sacola é uma aba do app.)

   TRÊS ANIMAÇÕES DIFERENTES, CADA UMA COM UM MOTIVO:

   1. Entrada (pop)     — nasce do nada quando o primeiro item entra. É o
                          "deu certo" de quem adicionou o lanche.
   2. Bump              — a bolha dá um tranco a cada item novo depois disso.
                          Sem ele, adicionar o 2º item não dá feedback nenhum
                          e o usuário clica de novo achando que falhou.
   3. Badge             — o número troca deslizando, nunca piscando
                          (PDF seção 06: "mudanças de número são animadas").
   ========================================================================== */
export default function BolhaCarrinho() {
  const { quantidadeTotal, abrir } = useCarrinho()
  const controles = useAnimationControls()

  // Guarda o valor anterior pra saber se o contador SUBIU. Um `useRef` não
  // causa re-render quando muda — é exatamente o que se quer pra memória
  // interna que a tela não precisa mostrar.
  const anterior = useRef(quantidadeTotal)
  const [visivel, setVisivel] = useState(quantidadeTotal > 0)

  useEffect(() => {
    const subiu = quantidadeTotal > anterior.current
    const primeiroItem = anterior.current === 0 && quantidadeTotal > 0

    anterior.current = quantidadeTotal
    setVisivel(quantidadeTotal > 0)

    // O bump só roda quando a bolha JÁ estava na tela. No primeiro item quem
    // dá o feedback é a animação de entrada — as duas juntas brigariam pelo
    // mesmo transform e a bolha apareceria tremendo.
    if (subiu && !primeiroItem) {
      controles.start({
        scale: [1, 1.18, 0.96, 1],
        transition: { duration: 0.42, ease: 'easeOut' },
      })
    }
  }, [quantidadeTotal, controles])

  return (
    <AnimatePresence>
      {visivel && (
        <motion.button
          type="button"
          onClick={abrir}
          aria-label={`Abrir carrinho, ${quantidadeTotal} ${
            quantidadeTotal === 1 ? 'item' : 'itens'
          }`}
          /* Pop de entrada: nasce pequena e gira um tiquinho. O overshoot do
             spring (stiffness alto, damping baixo) é o que dá a sensação de
             "pulou" em vez de "apareceu". */
          initial={{ scale: 0, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 15 }}
          transition={{ type: 'spring', stiffness: 520, damping: 16 }}
          whileTap={{ scale: 0.9 }}
          className="fixed top-6 left-6 z-50"
        >
          <motion.span
            animate={controles}
            className="relative grid size-13 place-items-center rounded-full bg-botao
                       text-white shadow-(--sombra-botao)
                       md:size-14"
          >
            <ShoppingBag size={22} strokeWidth={2.4} />

            {/* ---- BADGE ----
                Círculo vermelho por cima da bolha laranja: o vermelho é a
                convenção de "pendência" e destaca do laranja da marca. A
                borda cor do fundo separa o badge da bolha sem precisar de
                sombra. */}
            <span
              className="absolute -top-1 -right-1 grid min-w-6 place-items-center overflow-hidden
                         rounded-full border-2 border-fundo bg-texto px-1.5 py-0.5
                         font-display text-xs font-extrabold text-fundo tabular-nums"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={quantidadeTotal}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {quantidadeTotal}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

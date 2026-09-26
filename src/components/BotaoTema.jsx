import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTema } from '@/context/TemaContext'
import { useCarrinho } from '@/context/CarrinhoContext'

/* ============================================================================
   BOTÃO DE TEMA — flutuante, canto inferior esquerdo, sempre visível
   ----------------------------------------------------------------------------
   No celular ele fecha a "coluna" da esquerda: bolha do carrinho no topo,
   trilho de navegação no meio, tema embaixo. Tudo que é fixo mora no mesmo
   lado, e o polegar direito fica livre pro conteúdo.

   O ícone mostra o tema PRA ONDE você vai, não o atual: no escuro aparece
   o sol ("clique pra clarear"). É a convenção da maioria dos sites, e o
   rótulo acessível diz a mesma coisa.

   DESVIO DA BARRA DO CARRINHO
   Na página do cardápio, com item na sacola, existe uma barra fixa de
   largura total no rodapé. Sem o desvio, ela passaria por cima deste
   botão. Os 78px são: altura da barra (~81 no celular, ~89 no desktop) +
   12 de folga − a distância que o botão já tem do rodapé (16 / 24). Dá 77
   nos dois tamanhos, então um número só serve.
   ========================================================================== */
export default function BotaoTema() {
  const { tema, alternar } = useTema()
  const { pathname } = useLocation()
  const { quantidadeTotal } = useCarrinho()

  const escuro = tema === 'escuro'
  const barraDoCarrinho = pathname === '/cardapio' && quantidadeTotal > 0

  const aoClicar = (e) => {
    const caixa = e.currentTarget.getBoundingClientRect()
    alternar({ x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 })
  }

  const rotulo = escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'

  return (
    <motion.div
      animate={{ y: barraDoCarrinho ? -78 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="group fixed bottom-4 left-3 z-50 flex items-center gap-2 md:bottom-6 md:left-6"
    >
      <motion.button
        type="button"
        onClick={aoClicar}
        aria-label={rotulo}
        title={rotulo}
        whileTap={{ scale: 0.88 }}
        className="vidro relative grid size-12 place-items-center overflow-hidden rounded-full text-texto
                   transition-colors hover:text-acento md:size-13"
      >
        {/* Troca de ícone girando: o que sai gira pra um lado, o que entra
            vem do outro. `mode="popLayout"` tira o ícone velho do fluxo na
            hora, senão os dois ocupariam o botão juntos por um instante. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={tema}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="grid place-items-center"
          >
            {escuro ? (
              <Sun size={21} strokeWidth={2.2} />
            ) : (
              <Moon size={20} strokeWidth={2.2} />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Rótulo que desliza pro lado no hover — só onde existe mouse. No
          celular não há hover, e um texto fixo ali ocuparia espaço à toa. */}
      <span
        aria-hidden="true"
        className="vidro pointer-events-none hidden -translate-x-2 rounded-pill px-3 py-1.5 text-xs
                   font-semibold whitespace-nowrap text-texto opacity-0 transition-all duration-300
                   [@media(hover:hover)]:block group-hover:translate-x-0 group-hover:opacity-100"
      >
        {escuro ? 'Tema claro' : 'Tema escuro'}
      </span>
    </motion.div>
  )
}

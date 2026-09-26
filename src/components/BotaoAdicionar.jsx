import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Plus } from 'lucide-react'
import { useCarrinho } from '@/context/CarrinhoContext'
import { formatarPreco } from '@/data/cardapio'

/* ============================================================================
   BOTÃO ADICIONAR (da landing)
   ----------------------------------------------------------------------------
   Põe o lanche na sacola direto da landing, sem abrir o modal — quem quiser
   adicional vai pro cardápio completo. O feedback é duplo: a bolha do
   carrinho nasce/dá o tranco lá no canto, e o próprio botão vira
   "Na sacola ✓" por 1,6s (PDF seção 06: nenhuma ação sem resposta visual).

   O `acao` permite reusar o botão pra adicionar coisas que não são um item
   só (o combo inteiro, na seção Monte seu Combo).
   ========================================================================== */
export default function BotaoAdicionar({
  item,
  acao,
  rotulo = 'Adicionar',
  confirmacao = 'Na sacola',
  preco,
  larguraTotal = false,
  compacto = false,
  className = '',
}) {
  const { adicionar } = useCarrinho()
  const [feito, setFeito] = useState(false)

  // Volta ao normal depois de 1,6s. O return limpa o timer se o botão
  // sumir da tela antes disso — sem ele, o React avisaria de setState em
  // componente desmontado.
  useEffect(() => {
    if (!feito) return
    const id = setTimeout(() => setFeito(false), 1600)
    return () => clearTimeout(id)
  }, [feito])

  const aoClicar = () => {
    if (acao) acao()
    else adicionar(item, {}, 1)
    setFeito(true)
  }

  // `preco` omitido = mostra o preço do item; `preco={null}` = esconde
  // (quando o preço já aparece do lado do botão). Por isso é === undefined
  // e não ??: o ?? trataria null como "não passou" e mostraria de novo.
  const valor = preco === undefined ? item?.preco : preco

  // Versão só-ícone, pros cards de duas colunas do celular — num card de
  // 130px não cabe "Adicionar · R$ 18,00".
  if (compacto) {
    return (
      <motion.button
        type="button"
        onClick={aoClicar}
        whileTap={{ scale: 0.88 }}
        aria-label={feito ? `${item.nome} na sacola` : `Adicionar ${item.nome}`}
        className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors
                    ${feito ? 'bg-painel-2 text-acento' : 'botao-primario'} ${className}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={feito ? 'feito' : 'normal'}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            {feito ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={aoClicar}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-pill
                  px-5 py-3 font-display text-sm font-semibold tracking-wide uppercase transition-colors
                  ${feito ? 'bg-painel-2 text-acento' : 'botao-primario'}
                  ${larguraTotal ? 'w-full' : ''} ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {feito ? (
          <motion.span
            key="feito"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Check size={17} strokeWidth={3} /> {confirmacao}
          </motion.span>
        ) : (
          <motion.span
            key="normal"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Plus size={17} strokeWidth={3} /> {rotulo}
            {valor != null && (
              <span className="tabular-nums opacity-80">· {formatarPreco(valor)}</span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

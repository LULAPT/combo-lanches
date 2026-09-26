import { Minus, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

/* ============================================================================
   SELETOR DE QUANTIDADE
   ----------------------------------------------------------------------------
   Componente da seção 05 do PDF: "decremento/incremento com limites mínimo e
   máximo". Usado em três lugares (modal do item, linha do carrinho, lista de
   adicionais), por isso ele não sabe NADA sobre carrinho ou cardápio — só
   recebe um número e avisa quando quer mudar.

   Essa é a regra mais útil de componentização em React: se o componente
   precisa saber de onde o dado veio, ele não é reutilizável.

   `valor` vem de fora, `onMudar` avisa pra fora → é um componente controlado.
   Ele não guarda estado próprio, e por isso nunca pode divergir do carrinho.

   `removivel` (a linha do carrinho): na última unidade, o "−" vira lixeira.
   Descer pra zero ali TIRA o item da sacola, e o ícone avisa isso antes do
   clique — é o que dispensa uma lixeira separada na linha.
   ========================================================================== */
export default function SeletorQuantidade({
  valor,
  onMudar,
  min = 0,
  max = 99,
  tamanho = 'normal',
  rotulo = 'quantidade',
  removivel = false,
}) {
  const noMinimo = valor <= min
  const noMaximo = valor >= max
  const vaiRemover = removivel && valor === min + 1

  const compacto = tamanho === 'compacto'
  const botao = compacto ? 'size-7' : 'size-9'
  const icone = compacto ? 14 : 17

  return (
    <div
      className={`flex items-center gap-1 rounded-pill border border-linha bg-fundo/70 ${
        compacto ? 'p-0.5' : 'p-1'
      }`}
    >
      <button
        type="button"
        onClick={() => onMudar(valor - 1)}
        disabled={noMinimo}
        aria-label={vaiRemover ? `Remover ${rotulo}` : `Diminuir ${rotulo}`}
        className={`${botao} grid place-items-center rounded-full transition
                    hover:bg-painel-2 active:scale-90
                    disabled:pointer-events-none disabled:opacity-25
                    ${vaiRemover ? 'text-texto-suave hover:text-acento' : 'text-texto'}`}
      >
        {vaiRemover ? (
          <Trash2 size={icone - 1} strokeWidth={2.2} />
        ) : (
          <Minus size={icone} strokeWidth={2.5} />
        )}
      </button>

      {/* O número troca com um deslize curto pra cima/baixo em vez de piscar.
          `mode="popLayout"` tira o número velho do fluxo enquanto ele sai,
          senão os dois ocupam espaço junto e a largura pula. */}
      <span
        className={`relative grid ${compacto ? 'min-w-5 text-sm' : 'min-w-7'}
                    place-items-center overflow-hidden font-display font-bold tabular-nums`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={valor}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {valor}
          </motion.span>
        </AnimatePresence>
      </span>

      <button
        type="button"
        onClick={() => onMudar(valor + 1)}
        disabled={noMaximo}
        aria-label={`Aumentar ${rotulo}`}
        className={`${botao} grid place-items-center rounded-full text-texto transition
                    hover:bg-painel-2 active:scale-90
                    disabled:pointer-events-none disabled:opacity-25`}
      >
        <Plus size={icone} strokeWidth={2.5} />
      </button>
    </div>
  )
}

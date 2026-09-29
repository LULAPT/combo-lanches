import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Plus } from 'lucide-react'
import { formatarPreco } from '@/data/cardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import { useVoo } from '@/app/voo'
import { useItemAberto } from '@/app/useItemAberto'
import { TOM } from '@/app/abas'
import ArteProduto from '@/app/ArteProduto'

/* ============================================================================
   PRODUTO — as peças que mostram um item do cardápio no app
   ----------------------------------------------------------------------------
     BotaoMais     o "+" redondo: põe 1 na sacola e o desenho voa até ela
     CartaoLinha   linha larga (desenho à esquerda) — os hambúrgueres
     CartaoGrade   cartão em pé — grades de duas colunas e carrosséis

   O CARTÃO INTEIRO ABRE A FOLHA DO PRODUTO, e o "+" adiciona direto. Um
   <button> não pode ficar dentro de outro, então o cartão é um <article>
   com DOIS botões irmãos: um invisível esticado por cima do cartão todo
   (abre a folha) e o "+" por cima dele (z-10). Leitor de tela ouve os
   dois, cada um com o nome certo.

   O "afundar" do toque é CSS: o cartão encolhe um tico quando o botão
   esticado está pressionado (:has(.abrir-folha:active)). Com o whileTap da
   Motion no cartão, tocar no "+" encolheria o cartão inteiro junto.
   ========================================================================== */

export function BotaoMais({ item, className = '' }) {
  const { adicionar } = useCarrinho()
  const { voar } = useVoo()
  const [feito, setFeito] = useState(false)

  // volta a ser "+" depois de um instante. O return limpa o timer se o
  // botão sumir antes disso.
  useEffect(() => {
    if (!feito) return
    const id = setTimeout(() => setFeito(false), 1200)
    return () => clearTimeout(id)
  }, [feito])

  const aoTocar = (e) => {
    adicionar(item, {}, 1)
    voar(e.currentTarget, { item })
    setFeito(true)
  }

  return (
    <motion.button
      type="button"
      onClick={aoTocar}
      whileTap={{ scale: 0.84 }}
      aria-label={`Adicionar ${item.nome} à sacola`}
      className={`grid size-10 shrink-0 place-items-center rounded-full bg-botao text-white
                  shadow-(--sombra-botao) ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={feito ? 'feito' : 'mais'}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 520, damping: 24 }}
        >
          {feito ? <Check size={18} strokeWidth={3} /> : <Plus size={19} strokeWidth={2.8} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/* O botão invisível que cobre o cartão e abre a folha do produto. */
function AbrirFolha({ item }) {
  const { abrir } = useItemAberto()

  return (
    <button
      type="button"
      onClick={() => abrir(item.id)}
      aria-label={`Ver ${item.nome}, ${formatarPreco(item.preco)}`}
      className="abrir-folha absolute inset-0 rounded-[inherit]"
    />
  )
}

/* Sombra de contato no "chão" da vitrine — sem ela o desenho parece
   colado no fundo em vez de apoiado nele. */
function Chao({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute left-1/2 h-3 w-[56%] -translate-x-1/2 rounded-[50%]
                  bg-[radial-gradient(closest-side,var(--sombra-burger),transparent)] ${className}`}
    />
  )
}

/* ---- LINHA LARGA ----
   [ vitrine ]  NOME
                descrição em duas linhas
                R$ 12,50                    (+) */
export function CartaoLinha({ item }) {
  return (
    <article
      className="relative flex gap-3.5 rounded-3xl bg-cartao p-2.5 shadow-(--sombra-cartao) transition-transform
                 duration-150 has-[.abrir-folha:active]:scale-[0.985]"
    >
      <AbrirFolha item={item} />

      <span
        aria-hidden="true"
        className={`pointer-events-none relative grid size-[104px] shrink-0 place-items-center overflow-hidden
                    rounded-2xl ${TOM[item.categoria]}`}
      >
        <Chao className="bottom-3" />
        <ArteProduto item={item} className="relative" />
      </span>

      <div className="pointer-events-none relative flex min-w-0 flex-1 flex-col py-1 pr-1">
        <h3 className="titulo-app text-[17px] leading-tight text-texto">{item.nome}</h3>
        {/* pr-8: as duas linhas param no limite do X-Tudo que o Marco aprovou
            ("…queijo…"), rente ao canto do "+" (40px do botão,
            a 12px da borda, + um respiro). Sem isso a segunda linha corria
            por cima do botão e o "…" caía em qualquer lugar; assim ele cai
            sempre no mesmo limite, à esquerda do botão. */}
        <p className="mt-1 line-clamp-2 pr-8 text-[12.5px] leading-snug text-texto-suave">{item.descricao}</p>
        <p className="mt-auto pt-2 font-app text-[17px] font-bold text-texto tabular-nums">
          {formatarPreco(item.preco)}
        </p>
      </div>

      <BotaoMais item={item} className="absolute right-3 bottom-3 z-10" />
    </article>
  )
}

/* ---- CARTÃO EM PÉ ----
   [   vitrine   ]
   NOME
   R$ 6,90    (+)
   `baixo`: vitrine mais baixa (bebidas — são 19, a grade fica longa). */
export function CartaoGrade({ item, baixo = false, className = '' }) {
  return (
    <article
      className={`relative flex flex-col rounded-3xl bg-cartao p-2 shadow-(--sombra-cartao) transition-transform
                  duration-150 has-[.abrir-folha:active]:scale-[0.98] ${className}`}
    >
      <AbrirFolha item={item} />

      <span
        aria-hidden="true"
        className={`pointer-events-none relative flex items-end justify-center overflow-hidden rounded-2xl
                    ${baixo ? 'h-[108px] pb-3' : 'h-[128px] pb-3.5'} ${TOM[item.categoria]}`}
      >
        <Chao className={baixo ? 'bottom-2' : 'bottom-2.5'} />
        <ArteProduto item={item} proporcao={1.35} escala={item.camadas ? 1 : 0.92} className="relative" />
      </span>

      <div className="pointer-events-none relative flex flex-1 flex-col px-1.5 pt-2.5 pb-1">
        <h3 className="titulo-app line-clamp-2 text-[15px] leading-[1.1] text-texto">{item.nome}</h3>
        <p className="mt-auto pt-2.5 pr-11 font-app text-[16px] font-bold text-texto tabular-nums">
          {formatarPreco(item.preco)}
        </p>
      </div>

      <BotaoMais item={item} className="absolute right-2 bottom-2 z-10 size-9" />
    </article>
  )
}

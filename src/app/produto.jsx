import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { Check, Plus } from 'lucide-react'
import { formatarPreco } from '@/data/cardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import { useVoo } from '@/app/voo'
import { useItemAberto } from '@/app/useItemAberto'
import { TOM } from '@/app/abas'
import ArteProduto from '@/app/ArteProduto'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

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

/* ---- OS "+" EM FILA (só no Cardápio, `surgir`) ----
   Conforme a lista vai sendo revelada, cada "+" estoura no seu cartão NA
   SUA VEZ: quem chega à tela entra numa fila e sai 90ms depois do
   anterior. Vários chegando juntos (a primeira tela, uma rolagem rápida)
   estouram em sequência, de cima pra baixo; rolando devagar, cada um
   estoura quando o seu cartão chega. Pedido do Marco.
   Espera o cartão (que sobe com whileInView, no Cardapio.jsx) quase
   assentar antes de estourar. A fila é uma só pro app inteiro (o horário
   do próximo da fila), o que basta: só o Cardápio usa. */
const FILA_ESPERA_MS = 260
const FILA_INTERVALO_MS = 90
let proximoDaFila = 0

function naFila(fn) {
  const agora = performance.now()
  const quando = Math.max(agora + FILA_ESPERA_MS, proximoDaFila)
  proximoDaFila = quando + FILA_INTERVALO_MS
  const id = setTimeout(fn, quando - agora)
  return () => clearTimeout(id)
}

export function BotaoMais({ item, className = '', surgir = false }) {
  const { adicionar } = useCarrinho()
  const { voar } = useVoo()
  const [feito, setFeito] = useState(false)
  const menos = useMenosMovimento()
  const ref = useRef(null)
  const naTela = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const [chegou, setChegou] = useState(!surgir || menos)

  useEffect(() => {
    if (chegou || !naTela) return
    return naFila(() => setChegou(true))
  }, [chegou, naTela])

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
      ref={ref}
      type="button"
      onClick={aoTocar}
      // o estouro da fila: nasce do nada e cresce com um quique
      // Dois estados no animate, não um `initial`: as telas do app
      // desligam a animação de entrada dos filhos (initial={false} lá em
      // cima), e o initial seria ignorado — o "+" nasceria pronto. A mola
      // vai DENTRO do alvo: no botão, valeria pro toque também.
      animate={
        surgir
          ? chegou
            ? { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 520, damping: 17 } }
            : { scale: 0, opacity: 0, transition: { duration: 0 } }
          : undefined
      }
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
export function CartaoLinha({ item, surgirMais = false }) {
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

      <BotaoMais item={item} surgir={surgirMais} className="absolute right-3 bottom-3 z-10" />
    </article>
  )
}

/* Nomes que, numa linha só, ENCOSTAVAM no "+" do cartão em pé (a linha
   do nome passa rente ao topo do botão). Esses quebram antes da última
   palavra: "Coca-Cola / Garrafinha". Lista escolhida pelo Marco, um a um —
   não é regra geral, pra não mexer nos nomes que já estavam bons.
   Só aqui no cartão: o nome no cardapio.js continua inteiro (o site, a
   sacola e a folha do produto usam ele). Outro nome sufocando o "+"?
   Ponha o id aqui. */
const QUEBRA_ANTES_DA_ULTIMA = new Set(['batata-completa', 'antarctica-200', 'coca-200'])

function NomeQuebrado({ item }) {
  if (!QUEBRA_ANTES_DA_ULTIMA.has(item.id)) return item.nome
  const corte = item.nome.lastIndexOf(' ')
  return (
    <>
      {item.nome.slice(0, corte)}
      <br />
      {item.nome.slice(corte + 1)}
    </>
  )
}

/* ---- CARTÃO EM PÉ ----
   [   vitrine   ]
   NOME
   R$ 6,90    (+)
   `baixo`: vitrine mais baixa (bebidas — são 19, a grade fica longa). */
export function CartaoGrade({ item, baixo = false, className = '', surgirMais = false }) {
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
        <h3 className="titulo-app line-clamp-2 text-[15px] leading-[1.1] text-texto">
          <NomeQuebrado item={item} />
        </h3>
        <p className="mt-auto pt-2.5 pr-11 font-app text-[16px] font-bold text-texto tabular-nums">
          {formatarPreco(item.preco)}
        </p>
      </div>

      <BotaoMais item={item} surgir={surgirMais} className="absolute right-2 bottom-2 z-10 size-9" />
    </article>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { CupSoda, Hamburger, LayoutGrid, Search, SearchX, X } from 'lucide-react'
import { useCardapio } from '@/hooks/useCardapio'
import EstadoVazio from '@/components/EstadoVazio'
import IconeFritas from '@/components/IconeFritas'
import { CartaoGrade, CartaoLinha } from '@/app/produto'
import { CabecalhoTela, TituloSecao } from '@/app/pecas'

/* ============================================================================
   CARDÁPIO — o catálogo inteiro, no formato de app
   ----------------------------------------------------------------------------
   Em cima, o título. Logo abaixo, a busca e as categorias, que GRUDAM no
   topo quando você rola — o filtro fica sempre a um toque.

     Hambúrgueres     linhas largas: é o carro-chefe, merece desenho grande
                      e a descrição
     Acompanhamentos  cartões em pé, duas colunas
     Bebidas          cartões em pé mais baixos (são 19)

   A categoria escolhida mora na URL (?cat=bebidas): o ladrilho do Início
   leva direto pra ela, e o voltar do celular desfaz a escolha de tela, não
   de categoria (a troca de categoria usa replace).

   A aba fica montada quando você vai pra outra (AppCelular.jsx): a busca
   digitada e a rolagem continuam lá quando você volta.
   ========================================================================== */

const ICONES = { hamburgueres: Hamburger, acompanhamentos: IconeFritas, bebidas: CupSoda }

export default function Cardapio({ ativa }) {
  const [parametros, setParametros] = useSearchParams()
  const { state, key } = useLocation()
  const [busca, setBusca] = useState('')
  const campoRef = useRef(null)
  const marcoRef = useRef(null)

  /* A categoria vem da URL — mas só enquanto esta aba está na tela. Em
     outra aba a URL não tem ?cat=, e a lista escondida não pode "voltar
     pro Tudo" por baixo dos panos (mudaria de altura, e a rolagem guardada
     desta aba deixaria de bater). */
  const catDaUrl = parametros.get('cat')
  const [categoria, setCategoria] = useState(catDaUrl)
  if (ativa && catDaUrl !== categoria) setCategoria(catDaUrl)

  const { grupos, categorias, semResultado } = useCardapio({ busca, categoria })
  const { itens: todos } = useCardapio()

  // chegou pela busca do Início: o campo já vem com o foco
  useEffect(() => {
    if (ativa && state?.buscar) campoRef.current?.focus({ preventScroll: true })
  }, [ativa, key, state])

  const escolher = (id) => {
    setParametros(
      (atual) => {
        if (id) atual.set('cat', id)
        else atual.delete('cat')
        return atual
      },
      { replace: true },
    )
    // se a lista já tinha rolado pra baixo das categorias, ela recomeça
    // logo abaixo delas — senão a categoria nova apareceria pela metade
    const marco = marcoRef.current
    if (marco) {
      const topo = marco.getBoundingClientRect().top + window.scrollY
      if (window.scrollY > topo) window.scrollTo({ top: topo })
    }
  }

  return (
    <div className="pb-[calc(var(--altura-nav)+32px)]">
      {/* a nota não repete a da categoria Hambúrgueres ("do clássico ao
          artesanal"), que vem logo embaixo */}
      <CabecalhoTela nota="escolhe sem pressa" titulo="Cardápio" barra={false} />

      <div ref={marcoRef} />
      <BarraFiltros>
        <label className="campo-busca relative block">
          <span className="sr-only">Buscar no cardápio</span>
          <Search
            size={19}
            strokeWidth={2.2}
            className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-texto"
          />
          {/* 16px de letra no campo: menos que isso, o iPhone dá zoom na
              página inteira quando o campo ganha o foco */}
          <input
            ref={campoRef}
            type="search"
            enterKeyHint="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lanche, bebida…"
            className={`h-[52px] w-full rounded-2xl bg-cartao pl-12 text-base text-texto shadow-(--sombra-cartao)
                        outline-none placeholder:text-texto-suave focus-visible:ring-2 focus-visible:ring-acento
                        ${busca ? 'pr-12' : 'pr-4'}`}
          />
          {busca && (
            <button
              type="button"
              onClick={() => {
                setBusca('')
                campoRef.current?.focus()
              }}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 place-items-center rounded-full
                         bg-cartao-2 text-texto"
            >
              <X size={15} strokeWidth={2.6} />
            </button>
          )}
        </label>

        <Chips categorias={categorias} todos={todos} ativa={categoria} aoEscolher={escolher} />
      </BarraFiltros>

      <div className="px-5">
        {/* trocar de categoria troca a lista inteira com um fade curto;
            digitar na busca filtra no lugar (sem animar a cada letra) */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={categoria ?? 'tudo'}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {semResultado ? (
              <EstadoVazio
                icone={<SearchX size={28} />}
                titulo="Não achamos nada"
                texto={`Nada no cardápio com "${busca}". Tenta outra palavra.`}
                acao={
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="mt-2 rounded-full bg-botao px-6 py-3 text-[14px] font-bold text-white"
                  >
                    Limpar busca
                  </button>
                }
              />
            ) : (
              grupos.map((grupo) => <Grupo key={grupo.id} grupo={grupo} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* A barra que gruda: fundo desfocado e, só quando está grudada, uma linha
   embaixo separando do que passa por baixo. "Grudada" vem da rolagem
   (useScroll), comparando com a posição de um marco invisível logo acima
   dela — é estado de React, mas só muda quando cruza o marco. */
function BarraFiltros({ children }) {
  const barraRef = useRef(null)
  const [presa, setPresa] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', () => {
    const barra = barraRef.current
    if (!barra) return
    setPresa(barra.getBoundingClientRect().top <= 0.5 && window.scrollY > 0)
  })

  return (
    <div
      ref={barraRef}
      data-presa={presa}
      className={`barra-filtros sticky top-0 z-20 space-y-3 bg-fundo/88 px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3
                  backdrop-blur-xl transition-[box-shadow] duration-300
                  ${presa ? 'shadow-[0_1px_0_var(--color-linha),0_10px_24px_-18px_rgb(0_0_0/0.35)]' : ''}`}
    >
      {children}
    </div>
  )
}

/* As categorias em pílulas. A escolhida é invertida (fundo cor de texto),
   e o realce DESLIZA de uma pílula pra outra (layoutId). */
function Chips({ categorias, todos, ativa, aoEscolher }) {
  const grupo = useId()
  const lista = [
    { id: null, nome: 'Tudo', Icone: LayoutGrid, quantos: todos.length },
    ...categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      Icone: ICONES[c.id],
      quantos: todos.filter((item) => item.categoria === c.id).length,
    })),
  ]

  return (
    <div className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5" role="group" aria-label="Categorias">
      {lista.map(({ id, nome, Icone, quantos }) => {
        const escolhida = id === ativa
        return (
          <button
            key={id ?? 'tudo'}
            type="button"
            onClick={() => aoEscolher(id)}
            aria-pressed={escolhida}
            className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold
                        transition-colors ${escolhida ? 'text-fundo' : 'bg-cartao text-texto shadow-(--sombra-cartao)'}`}
          >
            {escolhida && (
              <motion.span
                layoutId={`chip-${grupo}`}
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-full bg-texto"
              />
            )}
            {Icone && <Icone size={16} strokeWidth={2.2} className="relative" />}
            <span className="relative">{nome}</span>
            <span className={`relative text-[12px] tabular-nums ${escolhida ? 'opacity-70' : 'text-texto-suave'}`}>
              {quantos}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* Uma categoria: título + lista. Cada cartão sobe quando entra na tela
   (whileInView, uma vez só), com um tico de atraso entre as colunas. */
function Grupo({ grupo }) {
  const largo = grupo.id === 'hamburgueres'
  const nota = grupo.chamada.charAt(0).toLowerCase() + grupo.chamada.slice(1)

  return (
    <section className="pt-7">
      <TituloSecao
        nota={nota}
        titulo={grupo.nome}
        acao={<span className="text-[12.5px] text-texto-suave tabular-nums">{grupo.itens.length} opções</span>}
      />
      <ul className={largo ? 'mt-3.5 space-y-3' : 'mt-3.5 grid grid-cols-2 gap-3'}>
        {grupo.itens.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -30px 0px' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: largo ? 0 : (i % 2) * 0.06 }}
          >
            {largo ? <CartaoLinha item={item} /> : <CartaoGrade item={item} baixo={grupo.id === 'bebidas'} />}
          </motion.li>
        ))}
      </ul>
    </section>
  )
}

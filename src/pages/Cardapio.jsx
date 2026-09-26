import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Clock, CupSoda, Hamburger, LayoutGrid, Search, SearchX, ShoppingBag, X } from 'lucide-react'
import { LOJA } from '@/data/cardapio'
import { useCardapio } from '@/hooks/useCardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import CardItem from '@/components/CardItem'
import ModalItem from '@/components/ModalItem'
import EstadoVazio from '@/components/EstadoVazio'
import IconeFritas from '@/components/IconeFritas'
import Grifo from '@/components/Grifo'
import Preco from '@/components/Preco'
import MiniBurger from '@/components/burger/MiniBurger'
import { Fritas, Lata } from '@/components/burger/ilustracoes'

/* ============================================================================
   CARDÁPIO — tela "Início / catálogo" do PDF (tela 2)
   ----------------------------------------------------------------------------
   Estrutura pedida pelo PDF: cabeçalho com acesso ao resumo · busca ·
   destaque · navegação horizontal por categoria · listagem · ação fixa
   condicional. A estrutura continua a mesma; o que mudou foi o visual,
   que agora fala a língua da landing (Oswald, grão, letreiro vazado) e
   mostra cada produto DESENHADO em vez de emoji.

   COMPOSIÇÕES:
   desktop  → topo com o título à esquerda e uma "vitrine" à direita (um
              burger aberto, uma batata e uma lata); hambúrgueres e
              acompanhamentos em grade de 3 com vitrine grande; bebidas numa
              prateleira de 5 por linha
   celular  → sem vitrine no topo (não cabe e empurraria a busca pra baixo
              da dobra); hambúrgueres e acompanhamentos viram LINHAS (desenho
              à esquerda, descrição inteira à direita); bebidas em 2 colunas
   ========================================================================== */

const ICONE_CATEGORIA = {
  hamburgueres: Hamburger,
  acompanhamentos: IconeFritas,
  bebidas: CupSoda,
}

// que formato de card cada categoria usa (ver CardItem.jsx) e sua grade
const FORMATO = {
  hamburgueres: 'destaque',
  acompanhamentos: 'produto',
  bebidas: 'compacto',
}
const GRADE = {
  destaque: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
  produto: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
  compacto: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
}

// recuo lateral padrão: à direita, o espaço do trilho de navegação do desktop
const RECUO = 'px-5 md:pr-24 md:pl-8 xl:pr-8'

export default function Cardapio() {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState(null)
  const [itemAberto, setItemAberto] = useState(null)

  const { grupos, categorias, maisPedidos, semResultado } = useCardapio({
    busca,
    categoria,
  })
  // sem filtro: a vitrine do topo e a contagem por categoria não podem
  // sumir quando o cliente digita na busca
  const { itens: todos } = useCardapio()

  const { quantidadeTotal, subtotal, abrir } = useCarrinho()

  const limparFiltros = () => {
    setBusca('')
    setCategoria(null)
  }

  const quantosEm = (idCategoria) => todos.filter((i) => i.categoria === idCategoria).length

  return (
    <div className="pb-32 md:pb-24">
      {/* ================= TOPO ================= */}
      <header className={`textura relative overflow-hidden border-b border-linha pt-32 pb-10 md:pt-20 ${RECUO}`}>
        {/* letreiro vazado gigante atrás, o mesmo recurso da hero */}
        <span
          aria-hidden="true"
          className="texto-vazado pointer-events-none absolute -bottom-[0.18em] left-2 font-display text-[30vw]
                     leading-none whitespace-nowrap uppercase select-none md:text-[14rem]"
        >
          Cardápio
        </span>

        <div className="relative mx-auto grid max-w-6xl items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="font-script text-2xl text-acento md:text-3xl">do clássico ao artesanal</p>
            <h1 className="text-[clamp(3.2rem,15vw,5rem)] leading-[0.9] md:text-8xl">Cardápio</h1>

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-suave">
              <span>{todos.length} itens</span>
              <span aria-hidden="true" className="h-3 w-px bg-linha" />
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-texto" /> abre às {LOJA.abre}
              </span>
              <span aria-hidden="true" className="h-3 w-px bg-linha" />
              <span>
                <Grifo>fechamento pelo iFood</Grifo>
              </span>
            </p>

            {/* ---- BUSCA EM TEMPO REAL ----
                Sem debounce de propósito: o filtro roda sobre ~30 itens em
                memória, custa microssegundos. Debounce aqui só atrasaria a
                tela. Quando virar chamada de rede, aí sim entra o debounce. */}
            <div className="relative mt-6 max-w-md">
              <Search
                size={18}
                // z-10: o campo tem vidro (backdrop-filter), e isso faz o
                // navegador pintá-lo POR CIMA de quem veio antes no HTML —
                // a lupa sumia atrás dele
                className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-texto-suave"
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar lanche, bebida, acompanhamento…"
                aria-label="Buscar no cardápio"
                // pr-11 só com texto: é o espaço do botão "limpar", que só
                // existe aí. Vazio, esse espaço cortava o fim do exemplo no
                // celular ("…acompanham")
                className={`vidro w-full rounded-pill py-3.5 pl-11 text-sm text-texto placeholder:text-texto-suave
                            focus:border-texto-suave focus:outline-none ${busca ? 'pr-11' : 'pr-4'}`}
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  aria-label="Limpar busca"
                  className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center
                             rounded-full text-texto-suave transition hover:bg-painel hover:text-texto"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <VitrineDoTopo todos={todos} />
        </div>
      </header>

      {/* ================= PRA COMEÇAR ================= */}
      {!busca && !categoria && (
        <section className={`mx-auto max-w-6xl pt-8 ${RECUO}`}>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-xl">Pra começar</h2>
            <span className="font-script text-xl text-acento">se não sabe o que pedir</span>
          </div>

          <ul className="sem-barra -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
            {maisPedidos.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="w-40 shrink-0 sm:w-44"
              >
                <CardItem item={item} onAbrir={setItemAberto} formato="compacto" />
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* ================= CATEGORIAS =================
          Gruda embaixo da pílula do cabeçalho no celular; no desktop não há
          cabeçalho no topo, então gruda no topo mesmo. */}
      <nav
        aria-label="Categorias"
        className="sticky top-16 z-30 mt-8 border-y border-linha bg-fundo/85 backdrop-blur-xl md:top-0"
      >
        <ul className={`sem-barra mx-auto flex max-w-6xl gap-2 overflow-x-auto py-3 ${RECUO}`}>
          <li className="shrink-0">
            <BotaoChip
              ativo={categoria === null}
              onClick={() => setCategoria(null)}
              contagem={todos.length}
              icone={<LayoutGrid size={15} />}
            >
              Tudo
            </BotaoChip>
          </li>

          {categorias.map((cat) => {
            const Icone = ICONE_CATEGORIA[cat.id]
            return (
              <li key={cat.id} className="shrink-0">
                <BotaoChip
                  ativo={categoria === cat.id}
                  onClick={() => setCategoria(cat.id)}
                  contagem={quantosEm(cat.id)}
                  icone={Icone && <Icone size={15} />}
                >
                  {cat.nome}
                </BotaoChip>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ================= LISTAGEM ================= */}
      <main className={`mx-auto max-w-6xl py-10 ${RECUO}`}>
        {semResultado ? (
          <EstadoVazio
            icone={<SearchX size={30} />}
            titulo="Nada encontrado"
            texto={`Não achamos nada para "${busca}". Tente outro termo ou veja o cardápio completo.`}
            acao={
              <button
                type="button"
                onClick={limparFiltros}
                className="botao-primario mt-2 rounded-pill px-6 py-3 font-display text-sm font-semibold
                           tracking-wide uppercase active:scale-95"
              >
                Ver tudo
              </button>
            }
          />
        ) : (
          <div className="space-y-14">
            {grupos.map((grupo) => {
              const Icone = ICONE_CATEGORIA[grupo.id]
              const formato = FORMATO[grupo.id] ?? 'produto'

              return (
                <section key={grupo.id} id={grupo.id} className="scroll-mt-40 md:scroll-mt-24">
                  <header className="mb-5 flex items-end gap-4">
                    {/* self-center: o ícone fica no meio do bloco nome +
                        frase manuscrita (com items-end ele sentava lá
                        embaixo, rente à frase, e parecia caído). Branco, não
                        vermelho: o vermelho fica pro que é ação. */}
                    {Icone && (
                      <span className="grid size-12 shrink-0 place-items-center self-center rounded-2xl border border-linha bg-painel text-texto">
                        <Icone size={22} strokeWidth={2} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-3xl leading-none md:text-4xl">{grupo.nome}</h2>
                      <p className="mt-1 font-script text-xl leading-none text-texto-suave">
                        {grupo.chamada}
                      </p>
                    </div>
                    <span aria-hidden="true" className="mb-2 hidden h-px flex-1 bg-linha sm:block" />
                    {/* no celular a contagem já está nos chips de categoria, e
                        aqui ela quebrava em duas linhas ao lado de nomes
                        longos como "Acompanhamentos" */}
                    <span className="mb-1 hidden font-display text-sm whitespace-nowrap text-texto-suave tabular-nums sm:inline">
                      {grupo.itens.length} {grupo.itens.length === 1 ? 'item' : 'itens'}
                    </span>
                  </header>

                  <ul className={GRADE[formato]}>
                    {grupo.itens.map((item, i) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        /* Entrada escalonada (PDF seção 06). O teto em 6 é
                           importante: sem ele, a 19ª bebida esperaria quase
                           1s pra aparecer — o usuário rolaria até um vazio. */
                        transition={{
                          delay: Math.min(i, 6) * 0.05,
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <CardItem item={item} onAbrir={setItemAberto} formato={formato} />
                      </motion.li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* ================= AÇÃO FIXA CONDICIONAL =================
          "Barra de ação inferior desliza para dentro/fora conforme o estado"
          (PDF, tela Início). Ela só existe quando há algo no carrinho. */}
      <AnimatePresence>
        {quantidadeTotal > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-fundo/90 p-3 backdrop-blur-xl md:p-4"
          >
            <button
              type="button"
              onClick={abrir}
              className="botao-primario mx-auto flex w-full max-w-md items-center justify-between gap-4
                         rounded-pill px-5 py-4 font-display font-semibold tracking-wide
                         uppercase active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={18} strokeWidth={2.6} />
                Ver pedido
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">
                  {quantidadeTotal}
                </span>
              </span>

              <Preco valor={subtotal} className="tabular-nums" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A key desmonta e remonta o modal a cada item — zera adicionais.
          Ver o comentário em ModalItem.jsx. */}
      <ModalItem
        key={itemAberto?.id ?? 'vazio'}
        item={itemAberto}
        aoFechar={() => setItemAberto(null)}
      />
    </div>
  )
}

/* ----------------------------------------------------------------------------
   VITRINE DO TOPO (só desktop)
   Um combo pousado num balcão: o burger mais completo, aberto, com uma
   batata completa e uma lata. É decoração — aria-hidden —, então usa os
   desenhos direto, sem passar pelo card.
-------------------------------------------------------------------------- */
function VitrineDoTopo({ todos }) {
  const burger = todos.find((i) => i.id === 'x-tudo-artesanal') ?? todos.find((i) => i.camadas)
  if (!burger) return null

  return (
    <div aria-hidden="true" className="relative hidden h-60 w-[25rem] items-end justify-center lg:flex">
      <span className="absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(ellipse_60%_55%_at_50%_80%,color-mix(in_oklab,var(--color-acento)_12%,transparent),transparent)]" />
      <span className="absolute bottom-1 left-1/2 h-4 w-[82%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,var(--sombra-burger),transparent)]" />

      <span className="relative z-10 mb-1 h-36 -rotate-6">
        <Fritas completa className="block h-full w-auto overflow-visible drop-shadow-[0_6px_8px_var(--sombra-burger)]" />
      </span>
      <span className="relative z-20 -mx-4 w-40">
        <MiniBurger camadas={burger.camadas} aberto />
      </span>
      <span className="relative z-10 mb-1 h-28 rotate-6">
        <Lata cor="#d9241c" className="block h-full w-auto overflow-visible drop-shadow-[0_6px_8px_var(--sombra-burger)]" />
      </span>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   CHIP DE CATEGORIA (componente da seção 05 do PDF)
   Ativo = invertido (fundo cor-de-texto, letra cor-de-fundo): contraste
   máximo nos dois temas, sem precisar de mais uma cor. O realce desliza
   entre os chips com layoutId.

   ALINHAMENTO: [ícone] [nome número]. A contagem é menor (text-xs) que o
   nome (text-sm); centralizados pela caixa, a base das letras não batia e
   o número parecia "boiando". Nome e número moram juntos num flex pela
   LINHA DE BASE (assentam na mesma linha, como texto corrido); o ícone
   fica de fora, centralizado com eles. O ícone não pode estar no mesmo
   grupo: um SVG não tem linha de base, e o navegador usaria a borda de
   baixo dele — o texto inteiro desceria.
-------------------------------------------------------------------------- */
function BotaoChip({ ativo, onClick, contagem, icone, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`relative flex items-center gap-1.5 rounded-pill border px-4 py-2 text-sm font-semibold
                  whitespace-nowrap transition-colors ${
                    ativo
                      ? 'border-transparent text-fundo'
                      : 'border-linha text-texto-suave hover:border-texto-suave/50 hover:text-texto'
                  }`}
    >
      {ativo && (
        <motion.span
          layoutId="chip-ativo"
          transition={{ type: 'spring', stiffness: 450, damping: 38 }}
          className="absolute inset-0 rounded-pill bg-texto"
        />
      )}
      {icone && <span className="relative flex">{icone}</span>}
      <span className="relative flex items-baseline gap-1.5">
        <span>{children}</span>
        <span className={`text-xs tabular-nums ${ativo ? 'opacity-60' : 'opacity-50'}`}>{contagem}</span>
      </span>
    </button>
  )
}

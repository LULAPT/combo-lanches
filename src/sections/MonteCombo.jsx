import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { formatarPreco } from '@/data/cardapio'
import { useCardapio } from '@/hooks/useCardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import SecaoEmpilhada from '@/components/SecaoEmpilhada'
import TituloSecao from '@/components/TituloSecao'
import MiniBurger from '@/components/burger/MiniBurger'
import BotaoAdicionar from '@/components/BotaoAdicionar'
import Preco from '@/components/Preco'
import Ilustracao from '@/components/Ilustracao'
import CenaBandeja from '@/components/CenaBandeja'

/* ============================================================================
   MONTE SEU COMBO — terceira camada da pilha
   ----------------------------------------------------------------------------
   O nome da loja é Combo. Então a seção interativa da landing é justamente
   montar um: lanche + acompanhamento + bebida, vendo a bandeja mudar e o
   total correr a cada escolha.

   ⚠️  O total é a SOMA dos preços do cardápio. Não existe preço de combo
   com desconto no iFood da loja, e inventar um seria prometer pro cliente
   final um valor que a loja não pratica. Se o dono criar preço de combo,
   é aqui que a conta muda.

   DUAS COMPOSIÇÕES:
   desktop  → bandeja grande à esquerda, PRESA (sticky) enquanto você rola
              as escolhas à direita, que aparecem como grade de opções
   celular  → bandeja quadrada no topo, escolhas viram fileiras de chips
              que rolam de lado (três fileiras de 6 opções empilhadas
              ocupariam a tela inteira), e o botão de largura total
   ========================================================================== */

// Bebidas que fazem sentido num combo individual — as garrafas de 1 e 2
// litros ficam de fora (estão no cardápio completo).
const BEBIDAS_DO_COMBO = ['coca-lata', 'fanta-lata', 'antarctica-350', 'h2o', 'suco', 'agua']


export default function MonteCombo() {
  const { itens } = useCardapio()
  const { adicionar } = useCarrinho()

  const porId = (id) => itens.find((i) => i.id === id) ?? null
  const lanches = itens.filter((i) => i.categoria === 'hamburgueres')
  const acompanhamentos = itens.filter((i) => i.categoria === 'acompanhamentos')
  const bebidas = BEBIDAS_DO_COMBO.map(porId).filter(Boolean)

  // Começa com o combo "clássico de vitrine": artesanal + batata + lata.
  const [lancheId, setLancheId] = useState('x-burguer-artesanal')
  const [acompId, setAcompId] = useState('batata-350')
  const [bebidaId, setBebidaId] = useState('coca-lata')

  const lanche = porId(lancheId)
  const acomp = porId(acompId)
  const bebida = porId(bebidaId)
  const escolhidos = [lanche, acomp, bebida].filter(Boolean)
  const total = escolhidos.reduce((soma, item) => soma + item.preco, 0)

  // Cada item entra como linha própria no carrinho — assim o cliente ainda
  // consegue tirar a bebida lá na sacola sem desmontar o combo inteiro.
  const adicionarCombo = () => escolhidos.forEach((item) => adicionar(item, {}, 1))

  return (
    <SecaoEmpilhada camada={3} id="combo" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 md:pr-24 md:pl-8 xl:pr-8">
        <TituloSecao nota="é o nome da casa, né?" titulo="Monte seu combo" />

        <div className="mt-10 grid gap-7 lg:mt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <Bandeja lanche={lanche} acomp={acomp} bebida={bebida} />

          <div className="flex min-w-0 flex-col gap-7">
            <Etapa
              numero="1"
              titulo="O lanche"
              opcoes={lanches}
              valor={lancheId}
              onMudar={setLancheId}
            />
            <Etapa
              numero="2"
              titulo="Acompanhamento"
              opcoes={acompanhamentos}
              valor={acompId}
              onMudar={setAcompId}
              nenhum="Sem acompanhamento"
            />
            <Etapa
              numero="3"
              titulo="Bebida"
              opcoes={bebidas}
              valor={bebidaId}
              onMudar={setBebidaId}
              nenhum="Sem bebida"
            />

            {/* ---- resumo ---- */}
            <div className="rounded-mordida border border-linha bg-painel p-5">
              <dl className="space-y-1.5 text-sm">
                {[
                  ['Lanche', lanche],
                  ['Acompanhamento', acomp],
                  ['Bebida', bebida],
                ].map(([rotulo, item]) => (
                  <div key={rotulo} className="flex justify-between gap-4">
                    <dt className="text-texto-suave">{rotulo}</dt>
                    <dd className="truncate text-right text-texto">
                      {item ? item.nome : '—'}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-end justify-between border-t border-linha pt-4">
                <span className="font-display text-lg tracking-wide text-texto uppercase">
                  Total
                </span>
                <Preco
                  valor={total}
                  className="font-display text-4xl font-semibold text-texto tabular-nums"
                />
              </div>

              <BotaoAdicionar
                acao={adicionarCombo}
                rotulo="Adicionar combo"
                confirmacao="Combo na sacola"
                preco={null}
                larguraTotal
                className="mt-4 py-4 text-base"
              />
            </div>
          </div>
        </div>
      </div>
    </SecaoEmpilhada>
  )
}

/* ----------------------------------------------------------------------------
   A BANDEJA — onde o combo aparece montado
   Cada peça tem `key` = id do item. Trocar o lanche troca a key, e o
   AnimatePresence faz o velho sair e o novo cair na bandeja. Sem a key, o
   React só trocaria o conteúdo por dentro e não haveria animação nenhuma.

   O cenário (painel, luz, elipse) é o CenaBandeja.jsx — o mesmo que abre o
   carrinho. Aqui só se decide onde cada peça pousa.
-------------------------------------------------------------------------- */
const QUEDA = {
  initial: { y: -60, opacity: 0, rotate: -10, scale: 0.9 },
  animate: { y: 0, opacity: 1, rotate: 0, scale: 1 },
  exit: { y: 30, opacity: 0, scale: 0.85 },
  transition: { type: 'spring', stiffness: 260, damping: 20 },
}

function Bandeja({ lanche, acomp, bebida }) {
  return (
    <CenaBandeja
      rotulo="o teu combo"
      className="aspect-square sm:aspect-[5/4] lg:sticky lg:top-10 lg:self-start"
    >
      <div className="absolute bottom-[21%] left-[48%] w-[25%]">
        <AnimatePresence mode="popLayout" initial={false}>
          {acomp && (
            <motion.div key={acomp.id} {...QUEDA}>
              <Ilustracao item={acomp} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-[13%] left-[7%] w-[45%]">
        <AnimatePresence mode="popLayout" initial={false}>
          {lanche && (
            <motion.div key={lanche.id} {...QUEDA}>
              <MiniBurger camadas={lanche.camadas} aberto />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute right-[7%] bottom-[12%] w-[15%]">
        <AnimatePresence mode="popLayout" initial={false}>
          {bebida && (
            <motion.div key={bebida.id} {...QUEDA}>
              <Ilustracao item={bebida} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CenaBandeja>
  )
}

/* ----------------------------------------------------------------------------
   UMA ETAPA — grupo de escolha única (componente da seção 05 do PDF)
   role="radiogroup"/"radio" + aria-checked: pro leitor de tela, isso é
   exatamente um grupo de rádio, mesmo parecendo botão.

   O realce desliza entre as opções com layoutId. Cada etapa precisa do
   PRÓPRIO layoutId (vem do useId) — com o mesmo nome nas três, escolher uma
   bebida faria o realce voar lá de cima, da lista de lanches.
-------------------------------------------------------------------------- */
function Etapa({ numero, titulo, opcoes, valor, onMudar, nenhum }) {
  const grupo = useId()
  const lista = nenhum ? [...opcoes, { id: null, nome: nenhum, preco: 0 }] : opcoes

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex items-baseline gap-2.5">
        <span className="font-script text-2xl leading-none text-acento">{numero}.</span>
        <span className="font-display text-xl tracking-wide text-texto uppercase">{titulo}</span>
      </legend>

      <div
        role="radiogroup"
        aria-label={titulo}
        className="sem-barra -mr-5 flex gap-2 overflow-x-auto pr-5 pb-1
                   lg:mr-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pr-0 lg:pb-0"
      >
        {lista.map((op) => {
          const ativo = op.id === valor

          return (
            <button
              key={op.id ?? 'nenhum'}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onMudar(op.id)}
              className={`relative flex shrink-0 items-center justify-between gap-3 rounded-pill border px-4 py-2.5
                          text-left text-sm transition-colors active:scale-[0.97] lg:rounded-2xl lg:py-3 ${
                            ativo
                              ? 'border-transparent text-fundo'
                              : 'border-linha text-texto hover:border-texto-suave'
                          }`}
            >
              {ativo && (
                <motion.span
                  layoutId={`combo-${grupo}`}
                  transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                  className="absolute inset-0 rounded-[inherit] bg-texto"
                />
              )}
              <span className="relative font-semibold whitespace-nowrap">{op.nome}</span>
              <span
                className={`relative text-xs whitespace-nowrap tabular-nums ${
                  ativo ? 'opacity-80' : 'text-texto-suave'
                }`}
              >
                {op.preco ? formatarPreco(op.preco) : '—'}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

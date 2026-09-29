import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Ban, Check, Plus } from 'lucide-react'
import { formatarPreco } from '@/data/cardapio'
import { useCardapio } from '@/hooks/useCardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import CenaBandeja from '@/components/CenaBandeja'
import MiniBurger from '@/components/burger/MiniBurger'
import Ilustracao from '@/components/Ilustracao'
import Preco from '@/components/Preco'
import ArteProduto from '@/app/ArteProduto'
import { useVoo } from '@/app/voo'
import { TOM } from '@/app/abas'
import NotaGrifada from '@/app/NotaGrifada'
import { CabecalhoTela } from '@/app/pecas'
import { COMBO_NA_BARRA, cascata, subir } from '@/app/animacoes'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'
import Fileira from '@/app/Fileira'
import ContornoGiz from '@/app/ContornoGiz'
import Adesivo from '@/app/Adesivo'

/* ============================================================================
   MONTE SEU COMBO — o botão do meio da barra
   ----------------------------------------------------------------------------
   A mesma ideia da seção do site (sections/MonteCombo.jsx), no formato do
   celular: a bandeja em cima, as três escolhas embaixo (cada uma uma
   fileira que rola de lado) e o total preso acima da barra de abas.

   ⚠️  O total é a SOMA dos preços do cardápio. Não existe preço de combo
   com desconto no iFood da loja, e inventar um seria prometer um valor que
   a loja não pratica. Se o dono criar preço de combo, é aqui (e no site)
   que a conta muda.

   ADICIONAR: cada peça entra como linha própria na sacola (dá pra tirar a
   bebida lá sem desmontar o combo) — e cada uma VOA da bandeja até a
   Sacola, uma logo depois da outra: lanche, batata, bebida.

   O BOTÃO SÓ CHEGA DEPOIS DO DISCO: a cada entrada na aba, o disco da
   logo desce pro meio da barra (NavInferior.jsx) e só então o "Adicionar
   combo" sai de trás dela, subindo. Antes, o disco ficava metade pra fora
   da barra e cobria um pedaço do botão. O ritmo é o COMBO_NA_BARRA
   (animacoes.js), o mesmo da barra.

   As escolhas ficam guardadas quando você troca de aba (a aba continua
   montada, ver AppCelular.jsx).
   ========================================================================== */

// Bebidas que fazem sentido num combo individual — as garrafas de 1 e 2
// litros ficam de fora (estão no cardápio). As mesmas do site.
const BEBIDAS_DO_COMBO = ['coca-lata', 'fanta-lata', 'antarctica-350', 'h2o', 'suco', 'agua']

// a queda na bandeja: a mesma do site
const QUEDA = {
  initial: { y: -60, opacity: 0, rotate: -10, scale: 0.9 },
  animate: { y: 0, opacity: 1, rotate: 0, scale: 1 },
  exit: { y: 30, opacity: 0, scale: 0.85 },
  transition: { type: 'spring', stiffness: 260, damping: 20 },
}

export default function Combo({ ativa }) {
  const menos = useMenosMovimento()
  const { itens } = useCardapio()
  const { adicionar } = useCarrinho()
  const { voar } = useVoo()

  const porId = (id) => itens.find((item) => item.id === id) ?? null
  const lanches = itens.filter((item) => item.categoria === 'hamburgueres')
  const acompanhamentos = itens.filter((item) => item.categoria === 'acompanhamentos')
  const bebidas = BEBIDAS_DO_COMBO.map(porId).filter(Boolean)

  // o combo "clássico de vitrine": artesanal + batata + lata
  const [lancheId, setLancheId] = useState('x-burguer-artesanal')
  const [acompId, setAcompId] = useState('batata-350')
  const [bebidaId, setBebidaId] = useState('coca-lata')
  const [feito, setFeito] = useState(false)

  const lanche = porId(lancheId)
  const acomp = porId(acompId)
  const bebida = porId(bebidaId)
  const escolhidos = [lanche, acomp, bebida].filter(Boolean)
  const total = escolhidos.reduce((soma, item) => soma + item.preco, 0)

  // de onde cada peça decola: a posição dela na bandeja
  const pecas = useRef({})
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!feito) return
    const id = setTimeout(() => setFeito(false), 1800)
    return () => clearTimeout(id)
  }, [feito])

  const adicionarCombo = (e) => {
    const botao = e.currentTarget
    escolhidos.forEach((item, i) => {
      adicionar(item, {}, 1)
      timers.current.push(
        setTimeout(() => voar(pecas.current[item.categoria] ?? botao, { item }), i * 140),
      )
    })
    setFeito(true)
  }

  return (
    <motion.div
      variants={cascata}
      initial="oculto"
      animate="visivel"
      className="pb-[calc(var(--altura-nav)+104px)]"
    >
      <CabecalhoTela nota="é o nome da casa, né?" titulo="Monte seu combo" />

      <motion.div variants={subir} className="px-5 pt-5">
        <CenaBandeja rotulo="o teu combo" className="aspect-[5/4]">
          <div ref={(el) => {
            pecas.current.acompanhamentos = el
          }} className="absolute bottom-[21%] left-[47%] w-[26%]">
            <AnimatePresence mode="popLayout" initial={false}>
              {acomp && (
                <motion.div key={acomp.id} {...QUEDA}>
                  <Ilustracao item={acomp} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={(el) => {
            pecas.current.hamburgueres = el
          }} className="absolute bottom-[13%] left-[6%] w-[45%]">
            <AnimatePresence mode="popLayout" initial={false}>
              {lanche && (
                <motion.div key={lanche.id} {...QUEDA}>
                  <MiniBurger camadas={lanche.camadas} aberto />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={(el) => {
            pecas.current.bebidas = el
          }} className="absolute right-[7%] bottom-[12%] w-[15%]">
            <AnimatePresence mode="popLayout" initial={false}>
              {bebida && (
                <motion.div key={bebida.id} {...QUEDA}>
                  <Ilustracao item={bebida} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CenaBandeja>
      </motion.div>

      <motion.div variants={subir}>
        <Etapa numero="1" titulo="O lanche" opcoes={lanches} valor={lancheId} onMudar={setLancheId} />
      </motion.div>
      <motion.div variants={subir}>
        <Etapa
          numero="2"
          titulo="Acompanhamento"
          opcoes={acompanhamentos}
          valor={acompId}
          onMudar={setAcompId}
          nenhum="Sem acompanhamento"
        />
      </motion.div>
      <motion.div variants={subir}>
        <Etapa numero="3" titulo="Bebida" opcoes={bebidas} valor={bebidaId} onMudar={setBebidaId} nenhum="Sem bebida" />
      </motion.div>

      {/* ---- O TOTAL, preso acima da barra de abas ----
          A mesma caixa da barra (px-3, até 480px, e a mesma margem
          negativa): o botão tem a largura da barra aberta.
          Fora da aba, ele volta pro começo ('fora') sem animar — a aba está
          escondida mesmo. Voltando pra ela, espera o disco e sobe de trás
          da barra (z 30, ela é 40): parece sair de dentro dela. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--altura-nav)+12px)] z-30 px-3">
        {/* a entrada anima a CAIXA, não o botão: a opacidade da Motion
            passaria por cima do disabled:opacity-50 dele */}
        <motion.div
          initial="fora"
          animate={ativa ? 'dentro' : 'fora'}
          variants={{
            fora: { y: 72, scale: 0.9, opacity: 0, transition: { duration: 0 } },
            dentro: {
              y: 0,
              scale: 1,
              opacity: 1,
              transition: menos
                ? { duration: 0 }
                : { type: 'spring', visualDuration: 0.42, bounce: 0.34, delay: COMBO_NA_BARRA.botao },
            },
          }}
          className="mx-auto max-w-[480px]"
        >
          <motion.button
            type="button"
            onClick={adicionarCombo}
            whileTap={{ scale: 0.97 }}
            disabled={!escolhidos.length}
            // botão não estica com margem negativa como uma div: a largura
            // vai escrita (100% + o que a barra abre dos dois lados)
            style={{ width: `calc(100% + ${COMBO_NA_BARRA.abre * 2}px)`, marginLeft: -COMBO_NA_BARRA.abre }}
            className="pointer-events-auto flex h-[58px] items-center justify-between gap-3 rounded-[22px] bg-botao px-5
                       text-white shadow-(--sombra-botao) disabled:opacity-50"
          >
            <span className="relative flex items-center overflow-hidden font-display text-[16px] font-bold">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={feito ? 'feito' : 'normal'}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  className="flex items-center gap-2"
                >
                  {feito ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  {feito ? 'Combo na sacola' : 'Adicionar combo'}
                </motion.span>
              </AnimatePresence>
            </span>
            <Preco valor={total} className="font-display text-[18px] font-bold tabular-nums" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ---- UMA ETAPA — grupo de escolha única ----
   role="radiogroup"/"radio" + aria-checked: pro leitor de tela, isso é um
   grupo de rádio, mesmo parecendo cartão. A escolha é CIRCULADA A GIZ
   (ContornoGiz): o traço se desenha em volta do cartão novo e o do antigo
   esmaece — um traço de giz deslizando de um cartão pro outro, como o aro
   liso de antes fazia, não pareceria feito à mão. O ✓ é um adesivo. */
function Etapa({ numero, titulo, opcoes, valor, onMudar, nenhum }) {
  const lista = nenhum ? [...opcoes, { id: null, nome: nenhum, preco: 0 }] : opcoes

  return (
    <fieldset className="mt-7 min-w-0">
      <legend className="flex items-baseline gap-2 px-5">
        <span className="font-script text-[26px] leading-none text-acento">
          <NotaGrifada>{numero}.</NotaGrifada>
        </span>
        <span className="titulo-app text-[22px] text-texto">{titulo}</span>
      </legend>

      <Fileira rotulo={titulo} papel="radiogroup">
        {lista.map((opcao) => {
          const ativo = opcao.id === valor
          return (
            <motion.button
              key={opcao.id ?? 'nenhum'}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => onMudar(opcao.id)}
              whileTap={{ scale: 0.95 }}
              className="relative flex w-[116px] shrink-0 snap-start flex-col rounded-[20px] bg-cartao p-1.5 text-left
                         shadow-(--sombra-cartao)"
            >
              {/* a escolha circulada a giz: se desenha em volta do cartão
                  escolhido; o da escolha anterior esmaece (ContornoGiz) */}
              <AnimatePresence>{ativo && <ContornoGiz key="contorno" />}</AnimatePresence>

              <span
                className={`relative flex h-[84px] items-end justify-center overflow-hidden rounded-[14px] pb-2
                            ${opcao.id ? TOM[opcao.categoria] : 'bg-cartao-2'}`}
              >
                {opcao.id ? (
                  <ArteProduto item={opcao} proporcao={1.25} escala={0.95} />
                ) : (
                  <Ban size={26} strokeWidth={2} className="mb-5 text-texto-suave" />
                )}
              </span>

              <span className="mt-2 line-clamp-2 min-h-[2lh] px-1 text-[12.5px] leading-tight font-semibold text-texto">
                {opcao.nome}
              </span>
              <span className="px-1 pt-0.5 pb-1 text-[12px] text-texto-suave tabular-nums">
                {opcao.id ? formatarPreco(opcao.preco) : 'sem custo'}
              </span>

              {/* o ✓ como adesivo, colado torto no canto (Adesivo.jsx) */}
              <AnimatePresence>
                {ativo && (
                  <Adesivo key="selo">
                    <Check size={16} strokeWidth={3.4} />
                  </Adesivo>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </Fileira>
    </fieldset>
  )
}

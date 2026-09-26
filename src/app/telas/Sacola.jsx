import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Info } from 'lucide-react'
import { ADICIONAIS, LOJA, TAXA_ENTREGA, formatarPreco } from '@/data/cardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import { useCardapio } from '@/hooks/useCardapio'
import SeletorQuantidade from '@/components/SeletorQuantidade'
import EstadoVazio from '@/components/EstadoVazio'
import Preco from '@/components/Preco'
import TextoTrocando from '@/components/TextoTrocando'
import BandejaPedido from '@/components/BandejaPedido'
import Pagamento from '@/components/Pagamento'
import ArteProduto from '@/app/ArteProduto'
import { CartaoGrade } from '@/app/produto'
import { TOM } from '@/app/abas'
import { CabecalhoTela, TituloSecao } from '@/app/pecas'
import { cascata, subir } from '@/app/animacoes'

/* ============================================================================
   SACOLA — o pedido, antes de pagar
   ----------------------------------------------------------------------------
   A mesma sacola da gaveta do site (CarrinhoContext): o que entra num lugar
   aparece no outro, até trocando de celular pra computador.

     a bandeja          o pedido inteiro pousado nela (BandejaPedido, a
                        mesma do site)
     as linhas          desenho, nome, extras anotados à mão, quantidade
     "não esquece"      o que falta no pedido: sem bebida, sugere bebida;
                        sem porção, sugere porção. Só itens do cardápio
     o resumo           entrega (a combinar) e o total
     Finalizar pedido   preso acima da barra — abre o pagamento SIMULADO
                        (Pagamento.jsx), o mesmo do site

   "Limpar" pede um segundo toque: apagar tudo num toque só, sem volta, é
   fácil demais de fazer sem querer.
   ========================================================================== */

const CONFIRMA_LIMPAR_MS = 3000

export default function Sacola() {
  const { itens, subtotal, quantidadeTotal, vazio, limpar } = useCarrinho()
  const [pagando, setPagando] = useState(false)
  const total = TAXA_ENTREGA === null ? subtotal : subtotal + TAXA_ENTREGA

  return (
    <motion.div
      variants={cascata}
      initial="oculto"
      animate="visivel"
      className={vazio ? 'pb-[calc(var(--altura-nav)+32px)]' : 'pb-[calc(var(--altura-nav)+104px)]'}
    >
      <CabecalhoTela
        nota="confere aí"
        titulo="Sua sacola"
        acao={!vazio && <BotaoLimpar aoLimpar={limpar} />}
      />

      {vazio ? (
        <motion.div variants={subir} className="px-5 pt-5">
          <BandejaPedido linhas={[]} />
          <EstadoVazio
            icone={false}
            titulo="Sua sacola está vazia"
            texto="Dá uma olhada no cardápio. Os artesanais são um bom começo."
            acao={
              <Link
                to="/cardapio"
                state={{ topo: true }}
                className="mt-2 flex items-center gap-2 rounded-full bg-botao px-6 py-3.5 text-[15px] font-bold text-white
                           shadow-(--sombra-botao)"
              >
                Ver cardápio <ArrowRight size={17} strokeWidth={2.6} />
              </Link>
            }
          />
        </motion.div>
      ) : (
        <>
          <motion.div variants={subir} className="px-5 pt-5">
            <p className="mb-2.5 text-[13px] text-texto-suave tabular-nums">
              {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'} no pedido
            </p>
            <BandejaPedido linhas={itens} />
          </motion.div>

          <motion.ul variants={subir} className="mt-4 space-y-3 px-5">
            {/* popLayout + layout: quando um item sai, os de baixo sobem
                deslizando em vez de pular pro lugar */}
            <AnimatePresence mode="popLayout" initial={false}>
              {itens.map((linha) => (
                <LinhaSacola key={linha.linhaId} linha={linha} />
              ))}
            </AnimatePresence>
          </motion.ul>

          <motion.div variants={subir}>
            <Sugestoes />
          </motion.div>

          <motion.section variants={subir} className="mx-5 mt-6 rounded-3xl bg-cartao p-5 shadow-(--sombra-cartao)">
            <dl className="space-y-2 text-[14px]">
              {TAXA_ENTREGA !== null && (
                <div className="flex justify-between gap-4">
                  <dt className="text-texto-suave">Subtotal</dt>
                  <dd className="text-texto tabular-nums">
                    <Preco valor={subtotal} />
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-texto-suave">Entrega</dt>
                <dd className="text-texto-suave">
                  {TAXA_ENTREGA === null ? 'a combinar' : formatarPreco(TAXA_ENTREGA)}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-linha pt-3">
                <dt className="titulo-app pb-1 text-[19px] text-texto">Total</dt>
                <dd>
                  <Preco valor={total} className="titulo-app text-[32px] text-texto tabular-nums" />
                </dd>
              </div>
            </dl>
          </motion.section>

          <motion.p variants={subir} className="mx-5 mt-4 flex gap-2 text-[12px] leading-relaxed text-texto-suave">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              Pagamento em demonstração: nenhuma cobrança é feita. Pra pedir de verdade, use o{' '}
              <a
                href={LOJA.pedidoExterno}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-texto underline underline-offset-2"
              >
                iFood da loja
              </a>
              .
            </span>
          </motion.p>

          {/* ---- FINALIZAR, preso acima da barra de abas ---- */}
          <div className="fixed inset-x-0 bottom-[calc(var(--altura-nav)+10px)] z-30 px-3">
            <motion.button
              type="button"
              onClick={() => setPagando(true)}
              whileTap={{ scale: 0.97 }}
              className="mx-auto flex h-[58px] w-full max-w-[480px] items-center justify-between gap-3 rounded-[22px]
                         bg-botao px-5 text-white shadow-(--sombra-botao)"
            >
              <span className="font-display text-[16px] font-bold">Finalizar pedido</span>
              <Preco valor={total} className="font-display text-[18px] font-bold tabular-nums" />
            </motion.button>
          </div>
        </>
      )}

      <Pagamento
        aberto={pagando}
        total={total}
        quantidade={quantidadeTotal}
        aoFechar={() => setPagando(false)}
        aoConcluir={() => {
          setPagando(false)
          limpar()
        }}
      />
    </motion.div>
  )
}

/* ---- UMA LINHA DO PEDIDO ---- */
function LinhaSacola({ linha }) {
  const { alterarQuantidade, precoDaLinha } = useCarrinho()
  const { itens } = useCardapio()
  const categoria = itens.find((item) => item.id === linha.itemId)?.categoria
  const extras = descreverAdicionais(linha.adicionais)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -70, transition: { duration: 0.22 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
      className="flex gap-3 rounded-3xl bg-cartao p-2.5 shadow-(--sombra-cartao)"
    >
      <span
        aria-hidden="true"
        className={`relative grid size-[82px] shrink-0 place-items-center overflow-hidden rounded-2xl ${TOM[categoria] ?? 'bg-cartao-2'}`}
      >
        <ArteProduto itemId={linha.itemId} camadas={linha.camadas} escala={0.9} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1">
        <div className="flex items-start justify-between gap-2">
          <p className="titulo-app text-[16.5px] leading-tight text-texto">{linha.nome}</p>
          <Preco
            valor={precoDaLinha(linha)}
            className="shrink-0 font-app text-[15px] font-bold text-texto tabular-nums"
          />
        </div>

        {/* os extras anotados à mão, em vermelho — como o atendente
            escreve na comanda (o mesmo da gaveta do site) */}
        {extras && <p className="mt-0.5 font-script text-[17px] leading-tight text-acento">+ {extras}</p>}

        <div className="mt-auto w-fit pt-2">
          <SeletorQuantidade
            valor={linha.quantidade}
            onMudar={(novo) => alterarQuantidade(linha.linhaId, novo - linha.quantidade)}
            min={0}
            max={20}
            tamanho="compacto"
            rotulo={linha.nome}
            removivel
          />
        </div>
      </div>
    </motion.li>
  )
}

// { bacon: 2, cheddar: 1 } → "2× bacon, queijo cheddar fatiado"
function descreverAdicionais(adicionais) {
  const partes = Object.entries(adicionais)
    .filter(([, qtd]) => qtd > 0)
    .map(([id, qtd]) => {
      const adicional = ADICIONAIS.find((a) => a.id === id)
      if (!adicional) return null
      const nome = adicional.nome.toLowerCase()
      return qtd > 1 ? `${qtd}× ${nome}` : nome
    })
    .filter(Boolean)

  return partes.length ? partes.join(', ') : null
}

/* ---- NÃO ESQUECE ----
   O que falta no pedido, na ordem em que as pessoas esquecem: primeiro a
   bebida, depois a porção, e por fim o doce. Some quando o pedido já tem
   de tudo. */
const SUGESTOES = [
  { falta: 'bebidas', nota: 'pra acompanhar', titulo: 'Não esquece a bebida', ids: ['coca-lata', 'fanta-lata', 'antarctica-350', 'h2o', 'suco', 'agua'] },
  { falta: 'acompanhamentos', nota: 'pra dividir', titulo: 'Que tal uma porção?', ids: ['batata-350', 'batata-completa', 'coxinha', 'mini-pizza'] },
  { falta: 'fatia-bolo', nota: 'pra fechar a conta', titulo: 'Um docinho?', ids: ['fatia-bolo'] },
]

function Sugestoes() {
  const { itens: linhas } = useCarrinho()
  const { itens } = useCardapio()
  const categoriaDe = (id) => itens.find((item) => item.id === id)?.categoria
  const naSacola = new Set(linhas.map((linha) => linha.itemId))
  const temCategoria = (categoria) => linhas.some((linha) => categoriaDe(linha.itemId) === categoria)

  const sugestao = SUGESTOES.find(({ falta }) => (falta === 'fatia-bolo' ? !naSacola.has(falta) : !temCategoria(falta)))
  if (!sugestao) return null

  const lista = sugestao.ids.map((id) => itens.find((item) => item.id === id)).filter(Boolean)

  return (
    <section className="pt-8">
      <TituloSecao nota={sugestao.nota} titulo={sugestao.titulo} className="px-5" />
      <div className="sem-barra flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pt-3.5 pb-4">
        {lista.map((item) => (
          <CartaoGrade key={item.id} item={item} baixo className="w-[140px] shrink-0 snap-start" />
        ))}
      </div>
    </section>
  )
}

/* "Limpar" → "Toca de novo" → limpa. O segundo toque tem prazo. */
function BotaoLimpar({ aoLimpar }) {
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (!confirmando) return
    const id = setTimeout(() => setConfirmando(false), CONFIRMA_LIMPAR_MS)
    return () => clearTimeout(id)
  }, [confirmando])

  return (
    <button
      type="button"
      onClick={() => {
        if (confirmando) aoLimpar()
        setConfirmando(!confirmando)
      }}
      className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
        confirmando ? 'bg-botao text-white' : 'bg-cartao text-texto shadow-(--sombra-cartao)'
      }`}
    >
      <TextoTrocando texto={confirmando ? 'Toca de novo' : 'Limpar'} />
    </button>
  )
}

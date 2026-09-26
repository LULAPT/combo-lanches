import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Info, X } from 'lucide-react'
import { ADICIONAIS, LOJA, TAXA_ENTREGA, formatarPreco } from '@/data/cardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import SeletorQuantidade from '@/components/SeletorQuantidade'
import EstadoVazio from '@/components/EstadoVazio'
import Preco from '@/components/Preco'
import BandejaPedido from '@/components/BandejaPedido'
import TextoTrocando from '@/components/TextoTrocando'
import Pagamento from '@/components/Pagamento'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   RESUMO DO PEDIDO (carrinho)
   ----------------------------------------------------------------------------
   Tela 4 do PDF. Lista com o detalhamento da personalização, totais, estado
   alternativo pra lista vazia e ação fixa com dois caminhos ("continuar
   explorando" e "prosseguir").

   O VISUAL fala a mesma língua da landing, peça por peça — nada aqui é
   inventado só pro carrinho:
     cabeçalho   o TituloSecao em miniatura: nota manuscrita em cima, título
                 grande, a linha correndo até a contagem
     bandeja     a MESMA do Monte seu Combo (CenaBandeja), com o pedido
                 inteiro pousando nela quando a gaveta abre
     números     os algarismos vazados dos Burgers ("01", "02"…)
     extras      anotados à mão, em vermelho — como o atendente escreve na
                 comanda. É o uso de acento que o index.css já prevê
                 ("anotação manuscrita")
     continuar   o link manuscrito do "cardápio completo →"

   ABRE PELA DIREITA, mesmo com a bolha na esquerda — decisão do Marco
   (testou saindo da esquerda e preferiu a direita). Não é descuido: não
   "conserte" pra sair do lado da bolha. O véu é o mesmo do trilho aberto
   (--veu).

   TAXA DE ENTREGA: mora no data/cardapio.js (hoje é null, "a combinar").
   Quando ela tiver valor, a linha "Subtotal" volta a aparecer sozinha.
   ========================================================================== */

// quanto tempo o "Limpar" espera o segundo toque antes de desistir
const CONFIRMA_LIMPAR_MS = 3000

// Transforma { bacon: 2, ovo: 1 } em "2× bacon, ovo" — a anotação da linha.
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

export default function CarrinhoDrawer() {
  const {
    itens,
    subtotal,
    quantidadeTotal,
    vazio,
    aberto,
    fechar,
    alterarQuantidade,
    limpar,
    precoDaLinha,
  } = useCarrinho()
  const reduzido = useMenosMovimento()
  const tituloId = useId()
  const fecharRef = useRef(null)
  // a janela de pagamento (simulado) aberta por cima do carrinho
  const [pagando, setPagando] = useState(false)
  // "Limpar" pede um segundo toque: apagar a sacola inteira num clique só,
  // sem volta, é fácil demais de fazer sem querer
  const [confirmaLimpar, setConfirmaLimpar] = useState(false)

  useEffect(() => {
    if (!aberto) return

    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // o foco entra na gaveta: quem navega pelo teclado começa aqui dentro,
    // e não lá atrás na página coberta pelo véu
    fecharRef.current?.focus({ preventScroll: true })

    const aoTeclar = (e) => e.key === 'Escape' && fechar()
    window.addEventListener('keydown', aoTeclar)

    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
      setConfirmaLimpar(false)
    }
  }, [aberto, fechar])

  // o segundo toque do "Limpar" tem prazo
  useEffect(() => {
    if (!confirmaLimpar) return
    const id = setTimeout(() => setConfirmaLimpar(false), CONFIRMA_LIMPAR_MS)
    return () => clearTimeout(id)
  }, [confirmaLimpar])

  const pedirLimpar = () => {
    if (confirmaLimpar) {
      setConfirmaLimpar(false)
      limpar()
    } else {
      setConfirmaLimpar(true)
    }
  }

  const total = TAXA_ENTREGA === null ? subtotal : subtotal + TAXA_ENTREGA

  // concluiu o pagamento (simulado): esvazia a sacola e fecha tudo
  const concluir = () => {
    setPagando(false)
    limpar()
    fechar()
  }

  return (
    <>
      <Pagamento
        aberto={pagando}
        total={total}
        quantidade={quantidadeTotal}
        aoFechar={() => setPagando(false)}
        aoConcluir={concluir}
      />
      {createPortal(
        <AnimatePresence>
          {aberto && (
            <div className="fixed inset-0 z-[70] flex justify-end">
              <motion.button
                type="button"
                aria-label="Fechar carrinho"
                tabIndex={-1}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={fechar}
                className="absolute inset-0 bg-(--veu) backdrop-blur-[6px]"
              />

              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-labelledby={tituloId}
                initial={reduzido ? { opacity: 0 } : { x: '100%' }}
                animate={reduzido ? { opacity: 1 } : { x: 0 }}
                exit={reduzido ? { opacity: 0 } : { x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                className="textura relative flex h-full w-full max-w-md flex-col border-l border-linha bg-fundo"
              >
                {/* ---- CABEÇALHO: o TituloSecao em miniatura ---- */}
                <header className="flex items-start gap-3 px-5 pt-5 pb-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-script text-2xl leading-none text-acento">confere aí</p>

                    <div className="mt-1.5 flex items-center gap-3">
                      <h2 id={tituloId} className="text-[2.75rem] leading-[0.9] text-texto">
                        Seu pedido
                      </h2>
                      <motion.span
                        aria-hidden="true"
                        className="h-px flex-1 origin-left bg-linha"
                        initial={reduzido ? false : { scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      />
                      {quantidadeTotal > 0 && (
                        <span className="font-script text-xl whitespace-nowrap text-texto-suave tabular-nums">
                          {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    ref={fecharRef}
                    type="button"
                    onClick={fechar}
                    aria-label="Fechar carrinho"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-linha
                               text-texto-suave transition hover:border-texto-suave hover:text-texto active:scale-90"
                  >
                    <X size={18} />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5">
                  {/* a bandeja fica na tela mesmo vazia: "Limpar" faz a
                      comida sair dela, e o vazio aparece no mesmo lugar */}
                  <BandejaPedido linhas={itens} />

                  {vazio ? (
                    <EstadoVazio
                      icone={false}
                      titulo="Sua sacola está vazia"
                      texto="Dá uma olhada no cardápio — os artesanais são um bom começo."
                      acao={
                        <Link
                          to="/cardapio"
                          onClick={fechar}
                          className="botao-primario mt-2 rounded-pill px-6 py-3 font-display
                                     text-sm font-semibold tracking-wide uppercase active:scale-95"
                        >
                          Ver cardápio
                        </Link>
                      }
                    />
                  ) : (
                    <>
                      <ul className="mt-2 divide-y divide-linha">
                        {/* `mode="popLayout"` + layout: quando um item sai, os de
                            baixo sobem deslizando em vez de pular pro lugar.
                            PDF: "transição de saída ao remover um item por completo". */}
                        <AnimatePresence mode="popLayout" initial={false}>
                          {itens.map((linha, i) => {
                            const extras = descreverAdicionais(linha.adicionais)

                            return (
                              <motion.li
                                key={linha.linhaId}
                                layout
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 48 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                                className="grid grid-cols-[2.6rem_minmax(0,1fr)_auto] items-start gap-x-3 py-4"
                              >
                                {/* o índice: vazado, como os números dos Burgers */}
                                <span
                                  aria-hidden="true"
                                  className="numero-pedido font-display text-[2.1rem] leading-[0.85] font-bold tabular-nums"
                                >
                                  {String(i + 1).padStart(2, '0')}
                                </span>

                                <div className="min-w-0">
                                  <p className="font-display text-lg leading-tight tracking-wide text-texto uppercase">
                                    {linha.nome}
                                  </p>

                                  {extras && (
                                    <p className="mt-0.5 font-script text-lg leading-snug text-acento">
                                      + {extras}
                                    </p>
                                  )}

                                  <div className="mt-2.5 w-fit">
                                    <SeletorQuantidade
                                      valor={linha.quantidade}
                                      onMudar={(novo) =>
                                        alterarQuantidade(
                                          linha.linhaId,
                                          novo - linha.quantidade,
                                        )
                                      }
                                      min={0}
                                      max={20}
                                      tamanho="compacto"
                                      rotulo={linha.nome}
                                      removivel
                                    />
                                  </div>
                                </div>

                                <Preco
                                  valor={precoDaLinha(linha)}
                                  className="font-display text-lg leading-tight font-semibold text-texto tabular-nums"
                                />
                              </motion.li>
                            )
                          })}
                        </AnimatePresence>
                      </ul>

                      <div className="flex justify-end border-t border-linha pt-2 pb-4">
                        <button
                          type="button"
                          onClick={pedirLimpar}
                          className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition ${
                            confirmaLimpar ? 'text-acento' : 'text-texto-suave hover:text-texto'
                          }`}
                        >
                          <TextoTrocando texto={confirmaLimpar ? 'Toca de novo pra limpar' : 'Limpar sacola'} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!vazio && (
                  <footer className="border-t border-linha px-5 pt-4 pb-5">
                    {/* ---- TOTAIS ---- */}
                    <dl className="text-sm">
                      {TAXA_ENTREGA !== null && (
                        <div className="flex justify-between gap-4 py-0.5">
                          <dt className="text-texto-suave">Subtotal</dt>
                          <dd className="text-texto tabular-nums">
                            <Preco valor={subtotal} />
                          </dd>
                        </div>
                      )}

                      <div className="flex justify-between gap-4 py-0.5">
                        <dt className="text-texto-suave">Entrega</dt>
                        <dd className="text-texto-suave">
                          {TAXA_ENTREGA === null
                            ? 'a combinar'
                            : formatarPreco(TAXA_ENTREGA)}
                        </dd>
                      </div>

                      <div className="mt-1 flex items-end justify-between gap-4">
                        <dt className="pb-1 font-display text-lg tracking-wide text-texto uppercase">Total</dt>
                        <dd>
                          <Preco
                            valor={total}
                            className="font-display text-4xl leading-none font-semibold text-texto tabular-nums"
                          />
                        </dd>
                      </div>
                    </dl>

                    {/* ---- AÇÃO FIXA COM DOIS CAMINHOS ----
                        O checkout de verdade ainda não existe (é o back-end de
                        outra pessoa). Até lá, abre o pagamento SIMULADO
                        (Pagamento.jsx): Pix com QR falso ou pagar na entrega. */}
                    <button
                      type="button"
                      onClick={() => setPagando(true)}
                      className="botao-primario mt-4 flex w-full items-center justify-center gap-2 rounded-pill
                                 py-4 font-display text-base font-semibold tracking-wide uppercase
                                 shadow-(--sombra-botao) active:scale-[0.98]"
                    >
                      Finalizar pedido
                      <ArrowRight size={18} strokeWidth={2.4} />
                    </button>

                    {/* o outro caminho, manuscrito como o "cardápio completo →"
                        dos títulos: existe, mas não disputa com o botão */}
                    <Link
                      to="/cardapio"
                      onClick={fechar}
                      className="mx-auto mt-2.5 block w-fit font-script text-xl text-texto-suave transition
                                 hover:text-acento"
                    >
                      ← continuar escolhendo
                    </Link>

                    <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-texto-suave">
                      <Info size={14} className="mt-px shrink-0" />
                      <span>
                        Pagamento em demonstração: nenhuma cobrança é feita. Pra pedir
                        de verdade, use o{' '}
                        <a
                          href={LOJA.pedidoExterno}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-texto underline underline-offset-2"
                        >
                          iFood da loja
                        </a>
                        .
                      </span>
                    </p>
                  </footer>
                )}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

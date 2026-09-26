import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { ADICIONAIS, camadasDoPedido, formatarPreco } from '@/data/cardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import SeletorQuantidade from '@/components/SeletorQuantidade'
import Preco from '@/components/Preco'
import MiniBurger from '@/components/burger/MiniBurger'
import Ilustracao, { escalaDe } from '@/components/Ilustracao'

/* ============================================================================
   DETALHE DO ITEM
   ----------------------------------------------------------------------------
   Tela 3 do PDF. "Entrada lateral (nova camada sobre a anterior)", ajuste de
   quantidade por opção com limites, cálculo do total em tempo real e barra de
   ação fixa com valor dinâmico.

   DUAS COISAS QUE VALE ENTENDER AQUI:

   1. createPortal — o modal é renderizado direto no <body>, não dentro do
      card que o abriu. Sem isso ele herda o `overflow:hidden` e o z-index do
      pai e aparece cortado dentro da grade do cardápio. Continua sendo filho
      no código React (o contexto do carrinho ainda funciona), só muda o lugar
      no DOM.

   2. `key={item.id}` lá no App — troca de item desmonta e remonta este
      componente, zerando os adicionais escolhidos. Sem a key, abrir o X Bacon
      depois do Mega Triplo herdaria os adicionais do anterior.

   O VISUAL é o mesmo do carrinho (CarrinhoDrawer.jsx), de propósito — as
   duas gavetas saem da direita e têm que parecer da mesma família:
   cabeçalho com nota manuscrita + título grande, vitrine numa caixa com a
   borda da mordida, lista sem caixa com linhas finas, adicional escolhido
   anotado à mão em vermelho ("×2"), e o botão em Oswald caixa alta.
   ========================================================================== */
export default function ModalItem({ item, aoFechar }) {
  // `{}` como inicial: id do adicional → quantidade. Só entra no objeto o que
  // foi de fato escolhido, então o carrinho não guarda uma dúzia de zeros.
  const [adicionais, setAdicionais] = useState({})
  const [quantidade, setQuantidade] = useState(1)
  const { adicionar, abrir } = useCarrinho()
  const tituloId = useId()
  const fecharRef = useRef(null)

  const aberto = Boolean(item)
  const aceitaAdicionais = item?.adicionais !== false

  // Trava a rolagem do fundo enquanto o modal está aberto. Sem isso o celular
  // rola a página atrás do modal quando o dedo passa da borda da lista.
  useEffect(() => {
    if (!aberto) return

    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // o foco entra na janela (teclado e leitor de tela começam aqui dentro)
    fecharRef.current?.focus({ preventScroll: true })

    const aoTeclar = (e) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', aoTeclar)

    // A função devolvida pelo useEffect é a "limpeza": roda quando o modal
    // fecha ou o componente some. Esquecer isso é o vazamento clássico do
    // React — a página fica travada pra sempre.
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto, aoFechar])

  // Zera as escolhas a cada item novo.
  useEffect(() => {
    setAdicionais({})
    setQuantidade(1)
  }, [item?.id])

  const total = useMemo(() => {
    if (!item) return 0

    const extras = Object.entries(adicionais).reduce((soma, [id, qtd]) => {
      const adicional = ADICIONAIS.find((a) => a.id === id)
      return adicional ? soma + adicional.preco * qtd : soma
    }, 0)

    return (item.preco + extras) * quantidade
  }, [item, adicionais, quantidade])

  const mudarAdicional = (id, valor) =>
    setAdicionais((atual) => {
      // Voltou a zero? Tira a chave do objeto em vez de deixar `bacon: 0`.
      // É o que garante que a identidade da linha no carrinho (gerarLinhaId)
      // trate "sem bacon" e "bacon zerado" como o mesmo pedido.
      if (valor <= 0) {
        const { [id]: _removido, ...resto } = atual
        return resto
      }

      return { ...atual, [id]: valor }
    })

  const confirmar = () => {
    adicionar(item, adicionais, quantidade)
    aoFechar()
    abrir() // feedback: o carrinho escancara que o item entrou
  }

  const quantidadeAdicionais = Object.values(adicionais).reduce(
    (soma, qtd) => soma + qtd,
    0,
  )

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={aoFechar}
            className="absolute inset-0 bg-(--veu) backdrop-blur-[6px]"
          />

          {/* Entrada pela direita = "aprofundar em um item empilha uma nova
              camada por cima" (PDF seção 06, DIREÇÃO). */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="textura relative flex h-full w-full max-w-lg flex-col border-l border-linha bg-fundo"
          >
            {/* ---- CABEÇALHO: o TituloSecao em miniatura, como no carrinho ---- */}
            <header className="flex items-start gap-3 px-5 pt-5 pb-4">
              <div className="min-w-0 flex-1">
                <p className="font-script text-2xl leading-none text-acento">
                  {aceitaAdicionais ? 'monta do teu jeito' : 'boa pedida'}
                </p>
                <h2 id={tituloId} className="mt-1.5 text-[2.5rem] leading-[0.92] text-texto">
                  {item.nome}
                </h2>
              </div>

              <button
                ref={fecharRef}
                type="button"
                onClick={aoFechar}
                aria-label="Fechar"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-linha
                           text-texto-suave transition hover:border-texto-suave hover:text-texto active:scale-90"
              >
                <X size={18} />
              </button>
            </header>

            {/* ---- CONTEÚDO ROLÁVEL ---- */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
              {/* Hambúrguer: o desenho do lanche COM os adicionais que o
                  cliente está escolhendo. +1 bacon ali embaixo e uma tira de
                  bacon cai aqui em cima, na hora — o estado `adicionais` é o
                  mesmo, então a tela e o pedido nunca discordam.
                  Outros itens usam o desenho deles, na mesma vitrine (balcão
                  com holofote e sombra) dos cards do cardápio — agora numa
                  caixa com a borda da mordida, como a bandeja do carrinho. */}
              <div
                aria-hidden="true"
                className="textura relative flex h-60 items-end justify-center overflow-hidden rounded-mordida
                           border border-linha bg-painel-2 pb-7"
              >
                <span className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_75%,color-mix(in_oklab,var(--color-texto)_6%,transparent),transparent)]" />
                <span className="absolute bottom-5 left-1/2 h-4 w-44 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,var(--sombra-burger),transparent)]" />

                {item.camadas ? (
                  <div className="relative w-40">
                    <MiniBurger camadas={camadasDoPedido(item, adicionais)} aberto />
                  </div>
                ) : (
                  <span className="relative flex items-end" style={{ height: `${escalaDe(item.id)}%` }}>
                    <Ilustracao item={item} className="block h-full w-auto overflow-visible" />
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <p className="max-w-[34ch] text-sm leading-relaxed text-texto-suave">{item.descricao}</p>
                <p className="shrink-0 font-display text-3xl leading-none font-semibold text-texto tabular-nums">
                  {formatarPreco(item.preco)}
                </p>
              </div>

              {item.maior18 && (
                <p className="mt-5 rounded-2xl border border-linha bg-painel px-4 py-3 text-xs text-texto-suave">
                  Venda proibida para menores de 18 anos. A idade é conferida
                  na entrega.
                </p>
              )}

              {aceitaAdicionais && (
                <section className="mt-7">
                  {/* título + linha correndo + nota manuscrita na ponta */}
                  <header className="flex items-center gap-3">
                    <h3 className="text-lg tracking-wide text-texto">Adicionais</h3>
                    <span aria-hidden="true" className="h-px flex-1 bg-linha" />
                    <span className="font-script text-lg whitespace-nowrap text-texto-suave tabular-nums">
                      {quantidadeAdicionais > 0
                        ? `${quantidadeAdicionais} escolhido${quantidadeAdicionais > 1 ? 's' : ''}`
                        : 'opcional'}
                    </span>
                  </header>

                  <ul className="mt-1 divide-y divide-linha">
                    {ADICIONAIS.map((adicional) => {
                      const qtd = adicionais[adicional.id] ?? 0
                      const escolhido = qtd > 0

                      return (
                        <li key={adicional.id} className="flex items-center gap-3 py-3">
                          <span className="flex min-w-0 flex-1 flex-col">
                            {/* PDF: "estado alterado com destaque visual
                                diferenciado do padrão". O destaque é a
                                anotação à mão, em vermelho — a mesma que
                                aparece na linha do carrinho depois. */}
                            <span className="flex items-baseline gap-2 text-sm font-semibold text-texto">
                              <span className="truncate">{adicional.nome}</span>
                              {escolhido && (
                                <span className="shrink-0 font-script text-lg leading-none font-normal text-acento tabular-nums">
                                  ×{qtd}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-texto-suave tabular-nums">
                              + {formatarPreco(adicional.preco)}
                            </span>
                          </span>

                          <SeletorQuantidade
                            valor={qtd}
                            onMudar={(v) => mudarAdicional(adicional.id, v)}
                            min={0}
                            max={adicional.max}
                            tamanho="compacto"
                            rotulo={adicional.nome}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )}

              <section className="mt-5 flex items-center justify-between gap-4 border-t border-linha pt-5">
                <h3 className="text-lg tracking-wide text-texto">Quantidade</h3>
                <SeletorQuantidade
                  valor={quantidade}
                  onMudar={setQuantidade}
                  min={1}
                  max={20}
                  rotulo="do lanche"
                />
              </section>
            </div>

            {/* ---- BARRA DE AÇÃO FIXA ----
                Mesma letra e mesmo peso do "Finalizar pedido" do carrinho:
                Oswald em caixa alta, com a sombra tingida do botão. */}
            <footer className="border-t border-linha px-5 pt-4 pb-5">
              <button
                type="button"
                onClick={confirmar}
                className="botao-primario flex w-full items-center justify-between gap-4 rounded-pill px-6 py-4
                           font-display text-base font-semibold tracking-wide uppercase shadow-(--sombra-botao)
                           active:scale-[0.98]"
              >
                <span>Adicionar ao carrinho</span>
                <Preco valor={total} className="text-lg tabular-nums" />
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

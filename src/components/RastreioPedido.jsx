import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChefHat, ClipboardCheck, House, Info, Motorbike, X } from 'lucide-react'
import { formatarPreco } from '@/data/cardapio'
import { PASSOS_PEDIDO, ULTIMO_PASSO } from '@/data/pedido'
import { usePedido } from '@/context/PedidoContext'
import { useEntradaSaida } from '@/hooks/useEntradaSaida'
import TextoTrocando from '@/components/TextoTrocando'

/* ============================================================================
   RASTREIO DO PEDIDO (simulado) — a linha do tempo da entrega
   ----------------------------------------------------------------------------
   Já foi uma etapa DENTRO da janela de pagamento, e sumia pra sempre quando
   ela fechava. Agora é uma janela própria, ligada ao pedido em andamento
   (PedidoContext): fecha e abre de novo quantas vezes quiser — pelo botão
   "Acompanhar pedido" do pagamento ou pela bolinha da moto (BolhaPedido).

   feito   check, e o fio até o próximo passo já preenchido
   atual   o ícone do passo em vermelho, com um anel pulsando, e uma
           barrinha que enche até o próximo passo começar
   depois  cinza, esperando

   O nome do passo atual é o título da janela — troca com o text swap
   (TextoTrocando) quando o pedido anda.

   Mesma entrada/saída e mesmo visual da janela de pagamento (as classes do
   dropdown, ver useEntradaSaida). Montado uma vez só, no App.jsx: vale pro
   site e pro app.
   ========================================================================== */

const ICONES = { recebido: ClipboardCheck, preparo: ChefHat, caminho: Motorbike, entregue: House }
const PAGAMENTO = { pix: 'Pix', debito: 'Débito na entrega', credito: 'Crédito na entrega' }

export default function RastreioPedido() {
  const { pedido, passo, decorrido, entregue, rastreioAberto, fecharRastreio } = usePedido()
  const { montado, classe } = useEntradaSaida(rastreioAberto && Boolean(pedido))
  const janelaRef = useRef(null)

  // a última "foto" do pedido: a janela ainda mostra ele durante a saída,
  // mesmo que o pedido acabe (entregue + fechar) no mesmo clique
  const [visto, setVisto] = useState(pedido)
  if (pedido && pedido !== visto) setVisto(pedido)

  useEffect(() => {
    if (montado) janelaRef.current?.focus()
  }, [montado])

  // Esc fecha
  useEffect(() => {
    if (!rastreioAberto) return
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      fecharRastreio()
    }
    window.addEventListener('keydown', aoTeclar, true)
    return () => window.removeEventListener('keydown', aoTeclar, true)
  }, [rastreioAberto, fecharRastreio])

  if (!montado || !visto) return null

  const forma = PAGAMENTO[visto.metodo === 'pix' ? 'pix' : visto.cartao] ?? ''

  return createPortal(
    <div className="fixed inset-0 z-[75] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Fechar rastreio"
        onClick={fecharRastreio}
        className={`pagamento-veu ${classe} absolute inset-0 bg-fundo/70 backdrop-blur-sm`}
      />

      <div
        ref={janelaRef}
        role="dialog"
        aria-modal="true"
        aria-label="Rastreio do pedido"
        tabIndex={-1}
        data-origin="top-center"
        className={`t-dropdown ${classe} relative outline-none`}
      >
        <div
          className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-mordida border border-linha bg-painel p-5
                     shadow-(--sombra-flutuante)"
        >
          <header className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl leading-tight tracking-wide text-texto uppercase">
                <TextoTrocando texto={PASSOS_PEDIDO[passo].titulo} />
              </h2>
              <p className="mt-1 text-xs text-texto-suave tabular-nums">
                Pedido #{visto.codigo} · {formatarPreco(visto.total)}
                {forma && ` · ${forma}`}
              </p>
            </div>
            <button
              type="button"
              onClick={fecharRastreio}
              aria-label="Fechar"
              className="grid size-8 shrink-0 place-items-center rounded-full text-texto-suave
                         transition hover:bg-painel-2 hover:text-texto active:scale-90"
            >
              <X size={18} />
            </button>
          </header>

          <ol className="mt-5" aria-live="polite">
            {PASSOS_PEDIDO.map(({ id, titulo, texto, inicioMs }, i) => {
              // no último passo, "atual" já é "feito": o pedido chegou
              const feito = i < passo || (entregue && i === ULTIMO_PASSO)
              const atual = i === passo && !feito
              const Icone = ICONES[id]
              const proximo = PASSOS_PEDIDO[i + 1]

              return (
                <li key={id} className="relative flex gap-3 pb-5 last:pb-0">
                  {/* o fio até o próximo passo */}
                  {i < ULTIMO_PASSO && (
                    <span
                      aria-hidden="true"
                      className={`absolute top-9 bottom-1 left-[15px] w-px transition-colors duration-500 ${
                        i < passo ? 'bg-texto' : 'bg-linha'
                      }`}
                    />
                  )}

                  <span
                    className={`relative grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                      feito
                        ? 'border-texto bg-texto text-fundo'
                        : atual
                          ? 'rastreio-atual border-acento text-acento'
                          : 'border-linha text-texto-suave'
                    }`}
                  >
                    {feito ? <Check size={15} strokeWidth={3} /> : <Icone size={15} />}
                  </span>

                  <div className="min-w-0 flex-1 pt-1">
                    <p className={`text-sm font-semibold transition-colors ${feito || atual ? 'text-texto' : 'text-texto-suave'}`}>
                      {titulo}
                    </p>
                    <p className="text-xs text-texto-suave">{texto}</p>

                    {/* a barrinha até o próximo passo: uma animação CSS da
                        duração do passo, começando "no meio" (delay
                        negativo) — se a janela abre com o passo pela
                        metade, a barra já nasce pela metade. key: passo
                        novo, barra nova. */}
                    {atual && proximo && (
                      <span aria-hidden="true" className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-linha">
                        <span
                          key={id}
                          className="pagamento-espera block h-full bg-acento"
                          style={{
                            '--espera': `${proximo.inicioMs - inicioMs}ms`,
                            animationDelay: `-${Math.max(0, decorrido - inicioMs)}ms`,
                          }}
                        />
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-texto-suave">
            <Info size={14} className="mt-px shrink-0" />
            <span>
              Simulação: os passos andam sozinhos, pra mostrar como vai ser.
              {!entregue && ' Pode fechar: a moto no canto da tela traz o rastreio de volta.'}
            </span>
          </p>

          <button
            type="button"
            onClick={fecharRastreio}
            className="mt-4 w-full rounded-pill border border-linha py-3 font-display text-sm font-semibold tracking-wide
                       text-texto uppercase transition hover:border-texto-suave active:scale-[0.98]"
          >
            {entregue ? 'Concluir' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

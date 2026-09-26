import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bike,
  Check,
  ChefHat,
  ClipboardCheck,
  Copy,
  House,
  Info,
  LoaderCircle,
  MapPinned,
  QrCode,
  X,
} from 'lucide-react'
import { LOJA, formatarPreco } from '@/data/cardapio'
import TextoTrocando from '@/components/TextoTrocando'
import QrCodeFalso from '@/components/QrCodeFalso'

/* ============================================================================
   PAGAMENTO — SIMULADO
   ----------------------------------------------------------------------------
   Ainda não existe back-end, então nada aqui cobra de verdade: é a tela de
   pagamento funcionando de ponta a ponta, pra mostrar ao cliente como vai
   ser. Duas formas, sem campo de cartão nenhum (dado de cartão só com
   gateway de verdade, e isso é coisa do back-end):

     PIX         gera um QR code FALSO (QrCodeFalso.jsx) e um "copia e cola"
                 que diz na cara que é demonstração. 4s depois, a "loja
                 recebe" o pagamento.
     NA ENTREGA  débito ou crédito na maquininha, quando o pedido chegar.

   As etapas:
     escolha → gerando → pix ──(4s)──┐
        └────→ confirmando ──(1,4s)──┴→ concluido ──(botão)──→ acompanhando

   ACOMPANHAR PEDIDO (também simulado): uma linha do tempo — recebido, em
   preparo, saiu pra entrega, entregue — que anda um passo a cada 4s.

   AVISO DE SIMULAÇÃO: se o site for ao ar antes do back-end, um cliente de
   verdade não pode sair achando que pagou. Por isso a nota "Simulação" e o
   link pro iFood da loja (o canal de pedidos que funciona hoje) ficam na
   primeira tela. Quando o back-end chegar, é aqui que o QR de verdade e a
   confirmação de verdade entram — o resto da tela continua igual.

   AS TRANSIÇÕES (index.css, bloco PAGAMENTO SIMULADO):
     menu dropdown  a janela entra crescendo de 97% a partir do topo
     text swap      o status do topo troca subindo e desfocando
     card resize    a janela muda de tamanho de uma etapa pra outra — e
                    encolhe no "confirmado", que tem menos coisa
   ========================================================================== */

const GERANDO_MS = 700
const ESPERA_PIX_MS = 4000
const CONFIRMANDO_MS = 1400
const SAIDA_MS = 150 // a --dropdown-close-dur do CSS

const CARTOES = { debito: 'Débito', credito: 'Crédito' }

// os passos do "acompanhar pedido" e quanto cada um leva na simulação
const PASSO_MS = 4000
const PASSOS = [
  { id: 'recebido', titulo: 'Pedido recebido', texto: 'A loja já está com o seu pedido', Icone: ClipboardCheck },
  { id: 'preparo', titulo: 'Em preparo', texto: 'A chapa já está esquentando', Icone: ChefHat },
  { id: 'caminho', titulo: 'Saiu pra entrega', texto: 'O entregador está a caminho', Icone: Bike },
  { id: 'entregue', titulo: 'Entregue!', texto: 'Bom apetite', Icone: House },
]

/* Abrir/fechar com as classes do dropdown: monta sem .is-open (o estado de
   partida, 97% e invisível), espera o navegador desenhar isso e aí põe
   .is-open; ao fechar, troca por .is-closing e só desmonta depois que a
   saída terminou. */
function useEntradaSaida(aberto) {
  const [fase, setFase] = useState(aberto ? 'aberto' : 'fechado')
  const [anterior, setAnterior] = useState(aberto)

  // o jeito do React de "reagir a uma prop que mudou" sem efeito: ajusta o
  // estado durante o próprio render
  if (aberto !== anterior) {
    setAnterior(aberto)
    setFase(aberto ? 'entrando' : 'saindo')
  }

  useEffect(() => {
    if (fase === 'entrando') {
      // dois quadros: o primeiro desenha o estado de partida
      let segundo
      const primeiro = requestAnimationFrame(() => {
        segundo = requestAnimationFrame(() => setFase('aberto'))
      })
      return () => {
        cancelAnimationFrame(primeiro)
        cancelAnimationFrame(segundo)
      }
    }
    if (fase === 'saindo') {
      const id = setTimeout(() => setFase('fechado'), SAIDA_MS)
      return () => clearTimeout(id)
    }
  }, [fase])

  return {
    montado: fase !== 'fechado',
    classe: fase === 'aberto' ? 'is-open' : fase === 'saindo' ? 'is-closing' : '',
  }
}

/* O "card resize": a caixa de fora tem altura explícita (a medida do
   conteúdo, lida por um ResizeObserver) e a transição do .t-resize anima
   de uma altura pra outra. Altura "auto" não anima — por isso a medida. */
function Redimensiona({ children }) {
  const dentroRef = useRef(null)
  const [altura, setAltura] = useState(null)

  useLayoutEffect(() => {
    const dentro = dentroRef.current
    const observador = new ResizeObserver(() => setAltura(dentro.offsetHeight))
    observador.observe(dentro)
    return () => observador.disconnect()
  }, [])

  return (
    <div className="t-resize overflow-hidden" style={{ height: altura ?? 'auto' }}>
      <div ref={dentroRef}>{children}</div>
    </div>
  )
}

// "CL-4821": o número do pedido, só pra tela
const novoCodigo = () => `CL-${Math.floor(1000 + Math.random() * 9000)}`

export default function Pagamento({ aberto, total, quantidade, aoFechar, aoConcluir }) {
  const { montado, classe } = useEntradaSaida(aberto)
  const [etapa, setEtapa] = useState('escolha')
  const [metodo, setMetodo] = useState('pix')
  const [cartao, setCartao] = useState('debito')
  const [pedido, setPedido] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [passo, setPasso] = useState(1) // no acompanhar: começa em "em preparo"
  const [anterior, setAnterior] = useState(aberto)
  const cartaoRef = useRef(null)

  // o pedido já foi feito (confirmado ou acompanhando): fechar é concluir
  const pedidoFeito = etapa === 'concluido' || etapa === 'acompanhando'

  // abriu de novo: começa do começo
  if (aberto !== anterior) {
    setAnterior(aberto)
    if (aberto) {
      setEtapa('escolha')
      setMetodo('pix')
      setCopiado(false)
    }
  }

  // os tempos entre as etapas
  useEffect(() => {
    const proxima = { gerando: ['pix', GERANDO_MS], pix: ['concluido', ESPERA_PIX_MS], confirmando: ['concluido', CONFIRMANDO_MS] }[etapa]
    if (!proxima) return
    const id = setTimeout(() => setEtapa(proxima[0]), proxima[1])
    return () => clearTimeout(id)
  }, [etapa])

  // acompanhando: um passo a cada PASSO_MS, até "entregue"
  useEffect(() => {
    if (etapa !== 'acompanhando' || passo >= PASSOS.length - 1) return
    const id = setTimeout(() => setPasso((p) => p + 1), PASSO_MS)
    return () => clearTimeout(id)
  }, [etapa, passo])

  // "Copiado!" volta a ser "Copiar" depois de um instante
  useEffect(() => {
    if (!copiado) return
    const id = setTimeout(() => setCopiado(false), 1800)
    return () => clearTimeout(id)
  }, [copiado])

  // abriu: o foco vai pra janela (teclado e leitor de tela começam nela)
  useEffect(() => {
    if (montado) cartaoRef.current?.focus()
  }, [montado])

  /* Esc fecha a janela — e SÓ ela. O carrinho, que está por baixo, também
     fecha no Esc; este ouvinte roda na fase de captura (o `true`), antes do
     dele, e o stopPropagation impede o Esc de chegar lá. No "confirmado",
     fechar é concluir (limpa a sacola). */
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      if (pedidoFeito) aoConcluir()
      else aoFechar()
    }
    window.addEventListener('keydown', aoTeclar, true)
    return () => window.removeEventListener('keydown', aoTeclar, true)
  }, [aberto, pedidoFeito, aoConcluir, aoFechar])

  if (!montado) return null

  // o pedido é "fotografado" no clique: o total e o código ficam fixos daqui
  // até o fim, mesmo que o carrinho seja limpo antes da janela sumir
  const iniciar = (proxima) => {
    const codigo = novoCodigo()
    setPedido({
      codigo,
      total,
      quantidade,
      copiaECola: `pix-demo/combo-lanches/${codigo}/${Math.random().toString(16).slice(2, 12).toUpperCase()}`,
    })
    setEtapa(proxima)
  }

  const fechar = () => (pedidoFeito ? aoConcluir() : aoFechar())

  const acompanhar = () => {
    setPasso(1)
    setEtapa('acompanhando')
  }

  const copiar = () => {
    navigator.clipboard?.writeText(pedido.copiaECola).then(() => setCopiado(true), () => {})
  }

  const valor = formatarPreco(pedido?.total ?? total)
  const status = {
    escolha: 'Como você quer pagar?',
    gerando: 'Gerando QR code…',
    pix: 'Aguardando pagamento…',
    confirmando: 'Enviando pedido pra loja…',
    concluido: metodo === 'pix' ? 'Pagamento confirmado!' : 'Pedido confirmado!',
    // o passo atual vira o título — e troca com o text swap a cada avanço
    acompanhando: PASSOS[passo].titulo,
  }[etapa]
  // gerando e pix são a mesma tela (o esqueleto vira QR sem trocar o miolo)
  const tela = etapa === 'gerando' ? 'pix' : etapa

  return createPortal(
    <div className="fixed inset-0 z-[75] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Fechar pagamento"
        onClick={fechar}
        className={`pagamento-veu ${classe} absolute inset-0 bg-fundo/70 backdrop-blur-sm`}
      />

      {/* dois elementos, uma transição cada: o de fora ENTRA (dropdown), o
          de dentro MUDA DE TAMANHO (resize). As duas classes definem
          `transition` — no mesmo elemento, uma apagaria a outra. */}
      <div
        ref={cartaoRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pagamento"
        tabIndex={-1}
        data-origin="top-center"
        className={`t-dropdown ${classe} relative outline-none`}
      >
        <div
          className={`t-resize overflow-hidden rounded-mordida border border-linha bg-painel shadow-(--sombra-flutuante)
                      ${pedidoFeito ? 'w-[min(21rem,calc(100vw-2rem))]' : 'w-[min(25rem,calc(100vw-2rem))]'}`}
        >
          <Redimensiona>
            <div className="p-5">
              {/* ---- topo: o status (text swap) e o fechar ---- */}
              <header className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl leading-tight tracking-wide text-texto uppercase">
                    <TextoTrocando texto={status} />
                  </h2>
                  {etapa !== 'concluido' && (
                    <p className="mt-1 text-xs text-texto-suave tabular-nums">
                      {pedido && etapa !== 'escolha'
                        ? `Pedido #${pedido.codigo} · ${valor}`
                        : `Total ${valor} · ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-texto-suave
                             transition hover:bg-painel-2 hover:text-texto active:scale-90"
                >
                  <X size={18} />
                </button>
              </header>

              {/* ---- o miolo de cada etapa (key: troca de etapa = entra de novo) ---- */}
              <div key={tela} className="pagamento-etapa">
                {tela === 'escolha' && (
                  <Escolha
                    metodo={metodo}
                    cartao={cartao}
                    aoMetodo={setMetodo}
                    aoCartao={setCartao}
                    aoSeguir={() => iniciar(metodo === 'pix' ? 'gerando' : 'confirmando')}
                  />
                )}

                {tela === 'pix' && (
                  <TelaPix
                    gerando={etapa === 'gerando'}
                    pedido={pedido}
                    copiado={copiado}
                    aoCopiar={copiar}
                    aoTrocar={() => setEtapa('escolha')}
                  />
                )}

                {tela === 'confirmando' && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-linha bg-fundo p-4">
                    <LoaderCircle size={22} className="shrink-0 animate-spin text-texto-suave" />
                    <div className="text-sm">
                      <p className="text-texto">{CARTOES[cartao]} na entrega</p>
                      <p className="text-xs text-texto-suave tabular-nums">{valor} na maquininha</p>
                    </div>
                  </div>
                )}

                {tela === 'concluido' && (
                  <Concluido
                    metodo={metodo}
                    cartao={cartao}
                    pedido={pedido}
                    valor={valor}
                    aoAcompanhar={acompanhar}
                    aoFechar={fechar}
                  />
                )}

                {tela === 'acompanhando' && <Acompanhamento passo={passo} aoFechar={fechar} />}
              </div>
            </div>
          </Redimensiona>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ---- ETAPA 1: a forma de pagamento ---- */
function Escolha({ metodo, cartao, aoMetodo, aoCartao, aoSeguir }) {
  return (
    <>
      <div role="radiogroup" aria-label="Forma de pagamento" className="mt-5 space-y-2">
        <Opcao
          ativa={metodo === 'pix'}
          aoEscolher={() => aoMetodo('pix')}
          Icone={QrCode}
          titulo="Pix"
          texto="Paga agora, pelo QR code ou copia e cola"
        />
        <Opcao
          ativa={metodo === 'entrega'}
          aoEscolher={() => aoMetodo('entrega')}
          Icone={Bike}
          titulo="Na entrega"
          texto="Débito ou crédito na maquininha"
        >
          {/* aparece de uma vez; quem anima é a janela crescendo (card resize) */}
          {metodo === 'entrega' && (
            <div role="radiogroup" aria-label="Cartão" className="mt-3 grid grid-cols-2 gap-1 rounded-pill bg-fundo p-1">
              {Object.entries(CARTOES).map(([id, nome]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={cartao === id}
                  onClick={() => aoCartao(id)}
                  className={`rounded-pill py-2 text-sm font-semibold transition ${
                    cartao === id ? 'bg-texto text-fundo' : 'text-texto-suave hover:text-texto'
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>
          )}
        </Opcao>
      </div>

      <button
        type="button"
        onClick={aoSeguir}
        className="botao-primario mt-5 flex w-full items-center justify-center gap-2 rounded-pill py-3.5
                   font-display text-sm font-semibold tracking-wide uppercase active:scale-[0.98]"
      >
        {metodo === 'pix' ? 'Gerar QR code' : 'Confirmar pedido'}
      </button>

      <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-texto-suave">
        <Info size={14} className="mt-px shrink-0" />
        <span>
          Simulação: nenhuma cobrança é feita. Pra pedir de verdade, use o{' '}
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
    </>
  )
}

/* Uma forma de pagamento: botão de rádio grande. O `children` (o débito /
   crédito) mora FORA do botão — botão dentro de botão não é HTML válido. */
function Opcao({ ativa, aoEscolher, Icone, titulo, texto, children }) {
  return (
    <div
      className={`rounded-2xl border p-3 transition-colors ${
        ativa ? 'border-texto-suave bg-painel-2' : 'border-linha hover:border-texto-suave/50'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={ativa}
        onClick={aoEscolher}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-linha bg-fundo text-texto">
          <Icone size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-texto">{titulo}</span>
          <span className="block text-xs text-texto-suave">{texto}</span>
        </span>
        {/* a bolinha do rádio */}
        <span
          aria-hidden="true"
          className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            ativa ? 'border-texto' : 'border-linha'
          }`}
        >
          <span className={`size-2 rounded-full bg-texto transition-transform ${ativa ? 'scale-100' : 'scale-0'}`} />
        </span>
      </button>
      {children}
    </div>
  )
}

/* ---- ETAPA 2 (Pix): o QR, o copia e cola e a espera ---- */
function TelaPix({ gerando, pedido, copiado, aoCopiar, aoTrocar }) {
  return (
    <div className="mt-5 flex flex-col items-center">
      {/* esqueleto com brilho enquanto "gera"; depois, o QR */}
      <div className={`relative size-52 overflow-hidden rounded-2xl ${gerando ? 'pagamento-gerando bg-painel-2' : ''}`}>
        {!gerando && <QrCodeFalso codigo={pedido.codigo} className="pagamento-etapa size-full" />}
      </div>
      <p className="mt-3 text-xs text-texto-suave">Abra o app do banco e escaneie o código</p>

      {/* copia e cola */}
      <div className="mt-4 flex w-full items-center gap-2 rounded-pill border border-linha bg-fundo p-1.5 pl-4">
        <code className="min-w-0 flex-1 truncate text-xs text-texto-suave">
          {gerando ? 'gerando…' : pedido.copiaECola}
        </code>
        <button
          type="button"
          onClick={aoCopiar}
          disabled={gerando}
          className="flex shrink-0 items-center gap-1.5 rounded-pill bg-painel-2 px-3 py-1.5 text-xs font-semibold
                     text-texto transition hover:bg-linha disabled:opacity-40"
        >
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          <TextoTrocando texto={copiado ? 'Copiado!' : 'Copiar'} />
        </button>
      </div>

      {/* a espera: a barrinha enche nos 4s até a "loja receber" */}
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-linha">
        {!gerando && (
          <div className="pagamento-espera h-full bg-texto-suave" style={{ '--espera': `${ESPERA_PIX_MS}ms` }} />
        )}
      </div>

      <button
        type="button"
        onClick={aoTrocar}
        className="mt-3 text-xs text-texto-suave underline-offset-2 transition hover:text-texto hover:underline"
      >
        Trocar forma de pagamento
      </button>
    </div>
  )
}

/* ---- ETAPA FINAL: confirmado (a janela encolhe: tem menos coisa) ---- */
function Concluido({ metodo, cartao, pedido, valor, aoAcompanhar, aoFechar }) {
  return (
    <div className="mt-4 flex flex-col items-center text-center">
      <svg viewBox="0 0 64 64" aria-hidden="true" className="size-16">
        <circle cx="32" cy="32" r="30" className="confirmado-circulo" style={{ fill: 'var(--color-acento)' }} />
        <path
          d="M19 33l9 9 17-19"
          pathLength="1"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="confirmado-marca"
        />
      </svg>

      <p className="mt-4 text-sm text-texto-suave">
        {metodo === 'pix'
          ? `Pix de ${valor} recebido.`
          : `Pague ${valor} no ${CARTOES[cartao].toLowerCase()} quando o pedido chegar.`}
      </p>
      <p className="mt-1 font-display text-lg tracking-wide text-texto uppercase tabular-nums">
        Pedido #{pedido.codigo}
      </p>

      <div className="mt-5 flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={aoAcompanhar}
          className="botao-primario flex w-full items-center justify-center gap-2 rounded-pill py-3 font-display
                     text-sm font-semibold tracking-wide uppercase active:scale-[0.98]"
        >
          <MapPinned size={17} strokeWidth={2.2} />
          Acompanhar pedido
        </button>
        <BotaoFechar aoFechar={aoFechar} />
      </div>
    </div>
  )
}

/* O "Fechar" das telas finais: neutro, pra o vermelho ficar só com a ação
   principal (acompanhar). Fechar aqui é concluir: esvazia a sacola. */
function BotaoFechar({ aoFechar }) {
  return (
    <button
      type="button"
      onClick={aoFechar}
      className="w-full rounded-pill border border-linha py-3 font-display text-sm font-semibold tracking-wide
                 text-texto uppercase transition hover:border-texto-suave active:scale-[0.98]"
    >
      Fechar
    </button>
  )
}

/* ---- ACOMPANHAR PEDIDO (simulado) ----
   A linha do tempo da entrega. O pedido já nasce "recebido" e "em preparo";
   a cada PASSO_MS ele anda um passo sozinho, até "entregue". O nome do passo
   atual é o status do topo da janela — troca com o mesmo text swap.

   feito   check branco, linha até o próximo já preenchida
   atual   o ícone do passo em vermelho, com um anel pulsando
   depois  cinza, esperando */
function Acompanhamento({ passo, aoFechar }) {
  const ultimo = PASSOS.length - 1

  return (
    <div className="mt-5">
      <ol>
        {PASSOS.map(({ id, titulo, texto, Icone }, i) => {
          // no último passo, "atual" já é "feito": o pedido chegou
          const feito = i < passo || (passo === ultimo && i === ultimo)
          const atual = i === passo && !feito

          return (
            <li key={id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* o fio até o próximo passo */}
              {i < ultimo && (
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

              <div className="min-w-0 pt-1">
                <p className={`text-sm font-semibold transition-colors ${feito || atual ? 'text-texto' : 'text-texto-suave'}`}>
                  {titulo}
                </p>
                <p className="text-xs text-texto-suave">{texto}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-texto-suave">
        <Info size={14} className="mt-px shrink-0" />
        <span>Simulação: os passos andam sozinhos, pra mostrar como vai ser.</span>
      </p>

      <div className="mt-4">
        <BotaoFechar aoFechar={aoFechar} />
      </div>
    </div>
  )
}

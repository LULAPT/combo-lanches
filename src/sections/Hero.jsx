import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from 'motion/react'
import { ArrowDown, ArrowRight, Clock, MapPin } from 'lucide-react'
import { LOJA } from '@/data/cardapio'
import { LOGO, empilhar } from '@/components/burger/geometria'
import { CAMADAS } from '@/components/burger/camadas'
import Camada from '@/components/burger/Camada'
import { ENTRADA, MOLA_ENTRADA } from '@/components/burger/entrada'
import GradeDeformavel from '@/components/GradeDeformavel'
import Gergelim from '@/components/Gergelim'
import FocoRevela from '@/components/FocoRevela'
import Grifo from '@/components/Grifo'
import Magnet from '@/components/reactbits/Magnet'
import { ScrollVelocity } from '@/components/reactbits/ScrollVelocity'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   HERO — a logo que desmonta
   ----------------------------------------------------------------------------
   A primeira coisa que o visitante vê é a logo do Combo, montada. Quando ele
   rola, o pão de cima sobe, o de baixo desce, e o recheio entra deslizando
   pelos lados entre eles — a logo vira um burger aberto, com anotações do
   que tem em cada camada. A grade do fundo deforma, empurrada pela abertura.

   COMO A ROLAGEM VIRA ANIMAÇÃO
   A hero é `sticky` e fica presa no topo. Logo depois dela, na .pilha, vem
   um <div> vazio de 170svh (o "trilho"). Enquanto você rola esse trilho, a
   hero não sai do lugar — o que muda é o progresso 0→1 que o useScroll
   mede. Quando o trilho acaba, a próxima seção sobe por cima.

   O progresso vira a variável CSS --p na raiz da hero, escrita direto no DOM
   (useMotionValueEvent), SEM passar por useState. Rolar a página não
   redesenha o React nenhuma vez: o CSS de cada peça (.peca-burger no
   index.css) faz a conta da própria posição a partir de --p.

   ⚠️  "UM destaque animado por vez" (PDF, seção 01): a logo é o destaque.
   Grade, gergelim, brilho e letreiro são fundo — todos lentos e apagados.
   Se adicionar algo aqui, que seja fundo também.
   ========================================================================== */

/* ---- A PILHA: de cima pra baixo ----
   `lado`: de onde a camada de recheio entra (-1 esquerda, 1 direita).
   Rótulo e nota das anotações saem das descrições do iFood — "crocante",
   "fatiado e em creme", "carne especial", "caramelizada", "caseiro" estão
   todos escritos lá. Não é texto de propaganda inventado. */
const PECAS = [
  { tipo: 'topo' },
  { tipo: 'salada', lado: -1, rotulo: 'Salada', nota: 'crocante' },
  { tipo: 'cheddar', lado: 1, rotulo: 'Cheddar', nota: 'fatiado e em creme' },
  { tipo: 'combo' },
  { tipo: 'carne', lado: -1, rotulo: 'Carne', nota: 'especial' },
  { tipo: 'cebola', lado: 1, rotulo: 'Cebola', nota: 'caramelizada' },
  { tipo: 'molho', lado: -1, rotulo: 'Molho', nota: 'caseiro' },
  { tipo: 'base' },
]

const FOLGA = 3.4
const aberta = empilhar(PECAS.map((p) => p.tipo), FOLGA)
const ALTURA = aberta.altura

// A logo montada fica centralizada na altura do burger aberto. Assim o
// palco tem tamanho fixo e abrir não empurra nada em volta.
const RECUO = (ALTURA - LOGO.altura) / 2

/* ---- A COREOGRAFIA ----
   Tudo em "cqw" (1% da largura do palco) e em fatias do progresso 0–1:
   0.06–0.50  pães se afastam
   0.24–0.82  recheio entra, uma camada a cada 0.07
   0.46–0.94  anotações se desenham
   0.94–1.00  pausa com tudo aberto antes da próxima seção subir */
let n = 0
const COREOGRAFIA = aberta.pecas.map((peca, i) => {
  const def = PECAS[i]

  if (def.tipo in LOGO) {
    return {
      ...peca,
      ...def,
      y0: LOGO[def.tipo].topo + RECUO,
      y1: peca.topo,
      x0: 0,
      o0: 1,
      ini: 0.06,
      dur: 0.44,
    }
  }

  const ordem = n++
  return {
    ...peca,
    ...def,
    ordem,
    y0: peca.topo,
    y1: peca.topo,
    x0: def.lado * 64,
    o0: 0,
    ini: 0.24 + ordem * 0.07,
    dur: 0.3,
  }
})

/* ---- ANOTAÇÕES (desktop) ----
   Todas do lado DIREITO: o esquerdo é do título. Camadas finas ficam muito
   perto umas das outras (o cheddar é colado na salada), então os rótulos
   são "empurrados" até ficarem a pelo menos 12.5cqw de distância, e a
   linha faz um cotovelo ligando a camada ao rótulo deslocado. */
const ROTULOS = COREOGRAFIA.filter((p) => p.lado).map((p) => ({
  ...p,
  yCamada: p.y1 + p.altura / 2,
  y: p.y1 + p.altura / 2,
  xBorda: (100 + CAMADAS[p.tipo].largura) / 2,
}))

for (let volta = 0; volta < 40; volta++) {
  for (let i = 1; i < ROTULOS.length; i++) {
    const falta = 12.5 - (ROTULOS[i].y - ROTULOS[i - 1].y)
    if (falta > 0) {
      ROTULOS[i - 1].y -= falta / 2
      ROTULOS[i].y += falta / 2
    }
  }
}

/* ---- ENTRADA (quando a página carrega) ----
   O "cai do céu e fecha" — ENTRADA e MOLA_ENTRADA vêm de burger/entrada.js,
   porque a logo cinza do trilho aberto repete a mesma animação.
   Separada da rolagem: é uma animação da Motion num elemento POR DENTRO do
   que a rolagem move. Transformações aninhadas se somam, então as duas
   convivem sem uma apagar a outra. */

export default function Hero() {
  const raizRef = useRef(null)
  const trilhoRef = useRef(null)
  const centroRef = useRef(null)
  const reduzido = useMenosMovimento()

  // progresso da abertura: 0 com o trilho entrando, 1 com ele acabando
  const { scrollYProgress } = useScroll({
    target: trilhoRef,
    offset: ['start end', 'end end'],
  })

  // A mola suaviza a rodinha do mouse, que rola aos "degraus" de 100px.
  // Sem ela, o burger abriria aos trancos.
  const suave = useSpring(scrollYProgress, { stiffness: 150, damping: 28, mass: 0.35 })

  // Menos movimento: burger já aberto, parado. Os dois hooks são chamados
  // SEMPRE (hook não pode ser condicional); só escolhemos qual usar.
  const aberto = useMotionValue(1)
  const progresso = reduzido ? aberto : suave

  /* Coberta: a próxima seção já tapou a hero inteira. O letreiro e o
     gergelim continuariam animando embaixo, gastando bateria à toa — então
     param. É estado de React, mas só muda 2 vezes por visita (cobriu /
     descobriu), não a cada frame. */
  const { scrollYProgress: cobertura } = useScroll({
    target: trilhoRef,
    offset: ['start end', 'end start'],
  })
  const [coberta, setCoberta] = useState(false)
  useMotionValueEvent(cobertura, 'change', (v) => setCoberta(v > 0.995))

  /* INTRO (título em foco + parágrafo digitado): uma vez por CARREGAMENTO
     da página. F5 ou aba nova → roda; ir pro cardápio e voltar pela
     navegação do site → não repete (ver a intro de novo a cada volta cansa).

     Já foi "uma vez por sessão" (sessionStorage), mas aí um F5 na mesma aba
     nunca mais mostrava a intro — inclusive pra quem está desenvolvendo e
     quer ver a animação de novo. A variável solta no módulo (introRodou)
     vive enquanto a página vive: some no F5, sobrevive à troca de rota. */
  const [jaViuIntro] = useState(() => introRodou)
  const pularIntro = reduzido || jaViuIntro
  const [tituloPronto, setTituloPronto] = useState(false)
  // o parágrafo terminou de ser digitado: hora dos grifos (marca-texto)
  const [textoPronto, setTextoPronto] = useState(false)

  const aoFimDoTitulo = () => {
    introRodou = true
    setTituloPronto(true)
  }

  const escreverP = (v) => raizRef.current?.style.setProperty('--p', v.toFixed(4))
  useLayoutEffect(() => escreverP(progresso.get()), [progresso])
  useMotionValueEvent(progresso, 'change', escreverP)

  return (
    <>
      <section
        ref={raizRef}
        id="inicio"
        aria-label="Início"
        // o CSS pausa o brilho do COMBO quando a hero está coberta
        data-coberta={coberta}
        className="sticky top-0 z-[1] h-svh overflow-hidden bg-fundo textura"
      >
        {/* ---------- FUNDO (só a hero tem) ---------- */}
        <GradeDeformavel
          progresso={progresso}
          centroRef={centroRef}
          className="absolute inset-0 size-full
                     [mask-image:radial-gradient(ellipse_70%_65%_at_50%_45%,black_30%,transparent_100%)]"
        />

        {/* letreiro gigante vazado correndo atrás — o ScrollVelocity do
            ReactBits acelera quando você rola rápido. Com menos movimento
            (sistema ou modo leve) ele fica PARADO: o ScrollVelocity roda um
            laço a cada quadro que nunca para, e é dos efeitos mais caros
            da página. */}
        {!coberta && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[40%] -translate-y-1/2 opacity-80 lg:top-[44%]"
          >
            {reduzido ? (
              <LetreiroParado />
            ) : (
              <ScrollVelocity
                texts={LETREIRO}
                velocity={26}
                numCopies={4}
                className={CLASSE_LETREIRO}
              />
            )}
          </div>
        )}

        <Gergelim pausado={coberta} />

        {/* ---------- CONTEÚDO ----------
            Duas composições de verdade, não uma encolhida:
            celular  → não passa por aqui: celular ganha o app (src/app).
                       As classes sem prefixo (abaixo do md) são do layout
                       antigo do celular e hoje não chegam a valer — o site
                       só aparece a partir de 768px (ver useCelular).
            tablet   → (md) coluna normal: burger em cima.
            desktop  → UM bloco centralizado: título + botões à esquerda,
                       burger à direita, os dois centralizados juntos na
                       vertical e na horizontal. O "centro" é o da área à
                       esquerda do trilho de navegação (lg:pr-28 reserva o
                       espaço dele), não o da tela inteira — senão o bloco
                       pareceria empurrado pra direita, colado no trilho.
                       lg:pb-[8svh]: o bloco não fica no centro EXATO da altura, fica um
                       pouco acima. Embaixo tem a dica de rolagem e em cima não tem
                       nada — no centro exato, o conjunto parecia "caído".
                       No DOM o burger vem primeiro (é o que o tablet mostra
                       primeiro); flex-row-reverse põe ele à direita, e o
                       flex-col-reverse põe ele embaixo no celular.
            pb-[4.75rem] no celular: é a altura do botão de tema, fixo no
            canto inferior esquerdo. Sem ela, ele cobria a ponta do botão
            "Ver o cardápio", que ocupa a largura toda. */}
        <div
          className="relative z-10 mx-auto flex h-full max-w-7xl flex-col-reverse px-5 pt-[4.75rem] pb-[4.75rem]
                     md:flex-col md:pt-10 md:pr-24 md:pb-5
                     lg:max-w-none lg:flex-row-reverse lg:items-center lg:justify-center
                     lg:gap-[clamp(2rem,4vw,5rem)] lg:pt-0 lg:pr-28 lg:pb-[8svh] lg:pl-10"
        >
          {/* ---- o burger ---- */}
          <div className="relative flex flex-1 items-center justify-center lg:flex-none">
            {/* brilho quente atrás do burger: vermelho largo + miolo amarelo.
                Mora aqui dentro (e não no fundo da seção) pra seguir o burger
                em qualquer layout — centralizado no celular, à direita no
                desktop. -z-10 põe ele atrás do burger mas ainda na frente do
                letreiro e da grade. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[min(120vmin,880px)]
                         -translate-x-1/2 -translate-y-1/2 animate-pulsa rounded-full
                         bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-acento)_16%,transparent),transparent)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[min(55vmin,420px)]
                         -translate-x-1/2 -translate-y-1/2 rounded-full
                         bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-texto)_5%,transparent),transparent)]"
            />

            <div
              ref={centroRef}
              className="w-[min(64vw,290px,calc((100svh-480px)/1.35))] md:w-[min(64vw,290px,calc((100svh-520px)/1.35))]
                         lg:w-[min(clamp(280px,26vw,390px),calc((100svh-170px)/1.42))]"
            >
              <PalcoBurger reduzido={reduzido} />
            </div>

            {/* celular: sem espaço pras anotações laterais — os
                ingredientes viram etiquetas embaixo do burger, e antes
                disso, a dica de rolar.

                NO CELULAR (max-md) as etiquetas descem pra FAIXA DE BAIXO
                da tela — o pb-[4.75rem] que já existia pro botão de tema —,
                à direita dele (left-12). Embaixo do burger elas ficavam POR
                TRÁS do pão de baixo quando ele abria: não sobra altura no
                celular pro burger aberto E duas fileiras de etiqueta. Um
                pouco menores (10px), as cinco cabem em duas fileiras — e,
                em tela de até 365px (Android comum), com menos respiro
                dentro de cada uma (px-1.5), senão viravam três. */}
            <div className="absolute inset-x-0 bottom-1 flex justify-center lg:-bottom-12 xl:hidden">
              <span
                className="flex items-center gap-1.5 font-script text-xl text-texto-suave"
                style={{ opacity: 'clamp(0, 1 - var(--p) * 8, 1)' }}
              >
                role pra abrir <ArrowDown size={15} className="animate-bounce" />
              </span>
              <ul
                className="anotacao-burger absolute bottom-0 flex flex-wrap justify-center gap-1.5
                           max-md:-right-3 max-md:-bottom-[3.75rem] max-md:left-11 max-md:gap-1"
                style={{ '--ini': 0.72, '--dur': 0.16 }}
              >
                {ROTULOS.map((r) => (
                  <li
                    key={r.tipo}
                    className="rounded-pill border border-linha bg-painel/80 px-2.5 py-1 font-display text-[11px]
                               tracking-wider text-texto uppercase max-md:px-2 max-md:text-[10px] max-[365px]:px-1.5"
                  >
                    {r.rotulo}{' '}
                    <span className="font-script text-sm text-acento normal-case max-md:text-[13px]">{r.nota}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---- título ---- */}
          <div className="relative lg:w-[min(33vw,480px)] lg:shrink-0">
            <motion.p
              initial={reduzido ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="vidro mb-4 inline-flex items-center gap-2.5 rounded-pill px-3.5 py-1.5 text-[11px]
                         font-semibold text-texto-suave lg:mb-6 lg:text-xs"
            >
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-acento" />
                {/* grifado: "Caetés" sozinho é ambíguo (tem I, II e III) */}
                <span>
                  <Grifo ligado={textoPronto}>{LOJA.bairro}</Grifo> · {LOJA.municipio}
                </span>
              </span>
              <span className="h-3 w-px bg-linha" />
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-acento" /> abre {LOJA.abre}
              </span>
            </motion.p>

            {/* TÍTULO: o TrueFocus adaptado (ver FocoRevela.jsx). Tudo
                começa borrado, a moldura passa por "Lanche", "de" e trava em
                "verdade." — que SE DESENHA (o StrokeText adaptado, ver
                PalavraTracada.jsx), em vermelho chapado, uma cor só. Quando
                termina de desenhar, o parágrafo começa a ser digitado. */}
            <FocoRevela
              palavras={[
                { texto: 'Lanche' },
                { texto: 'de', quebra: true },
                { texto: 'verdade.', tracado: true, cor: 'var(--color-acento)' },
              ]}
              pular={pularIntro}
              onFim={aoFimDoTitulo}
              className="text-[clamp(2.7rem,12vw,4rem)] leading-[0.9] lg:text-[clamp(3.8rem,6.4vw,6.6rem)]"
            />

            <TextoDigitado
              comecar={tituloPronto}
              pular={pularIntro}
              onPronto={setTextoPronto}
            />

            {/* ---- botões ----
                Ficam DENTRO do bloco do título, logo abaixo do parágrafo. Já
                estiveram no canto inferior esquerdo, mas ali o botão de tema
                (fixo no mesmo canto) passava por cima deles em telas até
                1280px.

                lg:flex-wrap: em tela lg estreita os dois botões lado a lado não
                cabem no bloco — o "ou" + o segundo descem pra linha de baixo em
                vez de invadir o burger. O border-transparent no botão vermelho
                é pra ele ter a mesma altura do de vidro, que tem borda de 1px.

                [Ver o cardápio]  ou  [Monte seu combo]
                No celular o primeiro ocupa a linha toda e o "ou" + o segundo
                ficam centralizados embaixo. */}
            <motion.div
              initial={reduzido ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="relative mt-5 flex flex-col gap-3 lg:mt-8 lg:flex-row lg:flex-wrap lg:items-center"
            >
              {/* padding = a distância (px) em volta do botão em que ele já
                  começa a seguir o mouse. Era 70 e o botão "fugia" de longe,
                  atrapalhando a leitura do parágrafo em cima dele. Com 16 ele
                  só reage quando o cursor praticamente encosta.
                  magnetStrength divide o deslocamento: maior = mais contido. */}
              <Magnet
                padding={16}
                magnetStrength={5}
                disabled={reduzido}
                wrapperClassName="w-full lg:w-auto"
                innerClassName="w-full lg:w-auto"
              >
                <Link
                  to="/cardapio"
                  className="botao-primario group flex w-full items-center justify-center gap-2 rounded-pill whitespace-nowrap
                             border border-transparent px-6 py-4 font-display text-lg font-semibold tracking-wide uppercase
                             shadow-(--sombra-botao) active:scale-95 lg:w-auto"
                >
                  Ver o cardápio
                  <ArrowRight
                    size={19}
                    strokeWidth={2.6}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Magnet>

              <div className="flex items-center justify-center gap-3">
                <span className="font-script text-2xl text-texto-suave">ou</span>
                <BotaoMonteCombo />
              </div>
            </motion.div>
          </div>

          {/* ---- dica de rolagem (desktop) ---- */}
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-[calc(50%-2.25rem)] hidden -translate-x-1/2 items-center gap-3 xl:flex"
            style={{ opacity: 'clamp(0, 1 - var(--p) * 8, 1)' }}
          >
            <span className="font-script text-2xl text-texto-suave">
              role pra abrir o combo
            </span>
            <span className="grid size-10 place-items-center rounded-full border border-linha">
              <ArrowDown size={16} className="animate-bounce text-acento" />
            </span>
          </div>
        </div>
      </section>

      {/* O TRILHO: espaço vazio que dá "comprimento" à animação. Com menos
          movimento ele some, e a próxima seção vem direto. */}
      <div
        ref={trilhoRef}
        aria-hidden="true"
        className={reduzido ? 'h-0' : 'h-[170svh]'}
      />
    </>
  )
}

/* ----------------------------------------------------------------------------
   O LETREIRO PARADO (menos movimento / modo leve)
   As mesmas duas frases do ScrollVelocity, na mesma letra, sem andar. Cada
   linha começa deslocada pra um lado — é o jeito como o letreiro aparece
   "congelado" num instante qualquer, e não duas linhas alinhadas à esquerda.
-------------------------------------------------------------------------- */
const LETREIRO = ['Combo Lanches —', 'Lanche de verdade —']
const CLASSE_LETREIRO = 'texto-vazado font-display text-[24vw] leading-[0.92] uppercase lg:text-[11.5rem]'

function LetreiroParado() {
  return (
    <div className="overflow-hidden">
      {LETREIRO.map((frase, i) => (
        <p
          key={frase}
          className={`${CLASSE_LETREIRO} whitespace-nowrap`}
          style={{ translate: i ? '-38% 0' : '-12% 0' }}
        >
          {Array(4).fill(frase).join(' ')}
        </p>
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------------------
   O PALCO: onde as peças são posicionadas
-------------------------------------------------------------------------- */
function PalcoBurger({ reduzido }) {
  return (
    // .animate-flutua: o burger "respira" parado. Fica num elemento só dele
    // porque usa `translate`, e as peças lá dentro usam `transform`.
    <div className="animate-flutua">
      <div className="palco-burger relative">
        <div className="relative" style={{ height: `${ALTURA}cqw` }}>
          {COREOGRAFIA.map((peca, i) => {
            const entrada = ENTRADA[peca.tipo]

            return (
              <div
                key={peca.tipo}
                className="peca-burger absolute top-0"
                style={{
                  left: `${peca.esquerda}cqw`,
                  width: `${peca.largura}cqw`,
                  // de cima pra baixo: cheddar por cima do COMBO, senão os
                  // pingos sumiriam atrás das letras
                  zIndex: 20 - i,
                  '--y0': peca.y0,
                  '--y1': peca.y1,
                  '--x0': peca.x0,
                  '--o0': peca.o0,
                  '--ini': peca.ini,
                  '--dur': peca.dur,
                }}
              >
                {entrada && !reduzido ? (
                  <motion.div
                    initial={entrada.initial}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ ...MOLA_ENTRADA, delay: entrada.delay }}
                  >
                    <Camada tipo={peca.tipo} className="drop-shadow-[0_4px_6px_var(--sombra-burger)]" />
                  </motion.div>
                ) : (
                  <Camada tipo={peca.tipo} className="drop-shadow-[0_4px_6px_var(--sombra-burger)]" />
                )}
              </div>
            )
          })}

          {/* ---- anotações (só desktop) ---- */}
          {/* Só a partir de 1280px: em telas lg (1024) as anotações
              encostariam no trilho de navegação da direita. Ali embaixo
              aparecem as etiquetas, como no celular. */}
          <div className="pointer-events-none absolute inset-0 hidden xl:block">
            <svg
              aria-hidden="true"
              className="absolute top-0 left-0 overflow-visible"
              style={{ width: '140cqw', height: `${ALTURA}cqw` }}
              viewBox={`0 0 140 ${ALTURA}`}
            >
              {ROTULOS.map((r) => (
                <g
                  key={r.tipo}
                  className="anotacao-burger"
                  style={{ '--ini': 0.46 + r.ordem * 0.07, '--dur': 0.2 }}
                >
                  <circle cx={r.xBorda + 1.2} cy={r.yCamada} r="0.9" fill="var(--color-acento)" />
                  <path
                    className="traco"
                    pathLength="1"
                    d={`M${r.xBorda + 1.2} ${r.yCamada} H106 L111 ${r.y} H117`}
                    fill="none"
                    stroke="var(--color-texto-suave)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}
            </svg>

            {ROTULOS.map((r) => (
              <div
                key={r.tipo}
                className="anotacao-burger absolute -translate-y-1/2 whitespace-nowrap"
                style={{
                  left: '119cqw',
                  top: `${r.y}cqw`,
                  '--ini': 0.52 + r.ordem * 0.07,
                  '--dur': 0.2,
                }}
              >
                <span className="block font-display text-sm tracking-[0.18em] text-texto uppercase">
                  {r.rotulo}
                </span>
                <span className="block font-script text-xl leading-none text-acento">
                  {r.nota}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   PARÁGRAFO DIGITADO
   Digitado bem rápido, logo depois do título travar no "verdade.".

   POR QUE NÃO O TextType DO REACTBITS (que foi a primeira versão)
   Ele digita UMA letra por setTimeout e redesenha o React a cada letra.
   Esse custo fixo (~9ms por letra no dev) virou o piso: mesmo pedindo 4ms
   por letra, a frase levava ~1,1s. Aqui a conta é por TEMPO, não por
   letra: a cada quadro da tela, "quantas letras já deveriam estar escritas
   a esta altura?" — e mostra todas de uma vez, escrevendo direto no DOM
   (textContent), sem render do React. A velocidade vira exatamente a que
   está em LETRAS_POR_SEGUNDO, sem piso. Se o navegador engasgar um
   quadro, o próximo só mostra mais letras de uma vez — nunca atrasa.

   Três cuidados:
   1. SEM PULO DE LAYOUT. O texto completo fica no lugar, invisível
      (`invisible` ocupa espaço, só não aparece), e a digitação acontece
      por cima dele, em posição absoluta — senão os botões desceriam a
      cada linha nova.
   2. O CURSOR SOME NO FIM. Fica um instante depois da última letra e
      sai: um cursor piscando pra sempre seria um segundo destaque animado
      na hero, e o PDF pede UM por vez.
   3. Leitor de tela lê o sr-only (o texto inteiro, uma vez), não a
      digitação letra a letra.
-------------------------------------------------------------------------- */
// Fica fora do componente de propósito: estado do React morre quando a
// hero desmonta (ao ir pro cardápio); uma variável de módulo, não.
let introRodou = false
const TEXTO_INTRO =
  'Do clássico de R$ 9,70 ao artesanal com cheddar e cebola caramelizada. Role a página e veja o que vai dentro de um Combo.'
// o convite pra rolar: a caneta passa nele quando a digitação termina
const GRIFO_INTRO = 'Role a página e veja'
const [ANTES_DO_GRIFO, DEPOIS_DO_GRIFO] = TEXTO_INTRO.split(GRIFO_INTRO)
// 260 letras/s: a frase inteira (121 letras) em ~0,45s
const LETRAS_POR_SEGUNDO = 260

function TextoDigitado({ comecar, pular, onPronto }) {
  const [fase, setFase] = useState(pular ? 'pronto' : 'espera')
  const textoRef = useRef(null)

  useEffect(() => {
    if (comecar && fase === 'espera') setFase('digitando')
  }, [comecar, fase])

  // avisa a hero (o grifo do "Caetés I" espera por isto). A hero passa o
  // próprio setState, que o React garante ser a mesma função sempre — então
  // o efeito só roda de novo quando a fase muda.
  useEffect(() => {
    if (fase === 'pronto') onPronto?.(true)
  }, [fase, onPronto])

  useEffect(() => {
    if (fase !== 'digitando') return

    let quadro = 0
    let saida = 0
    let inicio = null

    const passo = (agora) => {
      inicio ??= agora
      const letras = Math.min(
        TEXTO_INTRO.length,
        Math.floor(((agora - inicio) / 1000) * LETRAS_POR_SEGUNDO),
      )
      if (textoRef.current) textoRef.current.textContent = TEXTO_INTRO.slice(0, letras)

      if (letras < TEXTO_INTRO.length) quadro = requestAnimationFrame(passo)
      else saida = setTimeout(() => setFase('pronto'), 350) // cursor some depois de um instante
    }

    quadro = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(quadro)
      clearTimeout(saida)
    }
  }, [fase])

  return (
    <p className="relative mt-5 hidden max-w-[38ch] leading-relaxed text-texto-suave sm:block">
      <span className="sr-only">{TEXTO_INTRO}</span>
      <span aria-hidden="true" className={fase === 'pronto' ? '' : 'invisible'}>
        {ANTES_DO_GRIFO}
        {/* o texto digitado é só letra; o grifo mora no texto definitivo,
            que aparece quando a digitação acaba — e aí a caneta passa.
            150ms depois do "Caetés I" lá de cima: de cima pra baixo, o
            mesmo intervalo entre grifos de um bloco que o Lidera360 usa */}
        <Grifo ligado={fase === 'pronto'} atraso={150}>
          {GRIFO_INTRO}
        </Grifo>
        {DEPOIS_DO_GRIFO}
      </span>

      {fase === 'digitando' && (
        <span aria-hidden="true" className="absolute inset-0">
          {/* vazio no JSX de propósito: quem escreve aqui é o passo(), direto
              no DOM. O React não mexe nesse span, então os dois não brigam. */}
          <span ref={textoRef} />
          <span className="ml-0.5 text-acento">▍</span>
        </span>
      )}
    </p>
  )
}

/* ----------------------------------------------------------------------------
   BOTÃO "MONTE SEU COMBO"
   Par do "Ver o cardápio": MESMA tipografia (Oswald, caixa alta, mesmo
   tamanho e altura) e a mesma lógica de seta — lá ela aponta pra direita
   (vai pra outra página) e anda pra direita no hover; aqui aponta pra
   BAIXO (a seção fica mais abaixo nesta mesma página) e desce no hover.
   O que diferencia os dois é só o peso: o principal é vermelho chapado, este
   é vidro com a borda acendendo no hover.
-------------------------------------------------------------------------- */
function BotaoMonteCombo() {
  return (
    <Link
      to="/#combo"
      className="vidro group flex items-center justify-center gap-2 rounded-pill px-6 py-4 font-display
                 text-lg font-semibold tracking-wide whitespace-nowrap text-texto uppercase
                 transition-colors duration-200 hover:border-texto-suave focus-visible:border-texto-suave
                 active:scale-95"
    >
      Monte seu combo
      <ArrowDown
        size={19}
        strokeWidth={2.6}
        className="transition-transform group-hover:translate-y-1"
      />
    </Link>
  )
}

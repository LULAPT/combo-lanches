import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useAnimationFrame, useInView, useMotionValue, useScroll, useTransform } from 'motion/react'
import { ArrowRight, MapPin, Moon, Search, Sun } from 'lucide-react'
import { LOJA, formatarPreco } from '@/data/cardapio'
import { useCardapio } from '@/hooks/useCardapio'
import { useTema } from '@/context/TemaContext'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'
import MiniBurger from '@/components/burger/MiniBurger'
import { Fritas, Garrafinha, Lata } from '@/components/burger/ilustracoes'
import { CartaoGrade } from '@/app/produto'
import { useItemAberto } from '@/app/useItemAberto'
import { TituloRevelado, TituloSecao } from '@/app/pecas'
import { cascata, subir } from '@/app/animacoes'
import { TOM } from '@/app/abas'
import NotaGrifada from '@/app/NotaGrifada'
import IconeRamo from '@/components/IconeRamo'
import CountUp from '@/components/reactbits/CountUp'
import Fileira from '@/app/Fileira'

/* ============================================================================
   INÍCIO — a primeira tela do app
   ----------------------------------------------------------------------------
   Pouca coisa, de propósito. É a porta: quem abre o app quer comer, não
   ler. De cima pra baixo:

     onde a loja fica + o tema          (a única troca de tema do app)
     "boa noite! / Bateu a fome?"       a saudação muda com a hora
     a busca                            leva pro Cardápio, já digitando
     dois cartões grandes, de lado      Monte seu combo · o mais completo
     as categorias, em mosaico          tocar filtra o Cardápio
     "Pra começar"                      uma fileira de lanches pra decidir

   Nenhum número inventado: nada de "mais vendido", nada de promoção. Os
   cartões grandes chamam pro que a casa tem de mais seu — o combo (é o
   nome da loja) e o lanche mais completo do cardápio.
   ========================================================================== */
export default function Inicio() {
  const navigate = useNavigate()
  const { itens, maisPedidos } = useCardapio()
  const quantos = (categoria) => itens.filter((item) => item.categoria === categoria).length
  // um gatilho só pros três ladrilhos: os números vazados entram EM ORDEM
  // (ver NumeroVazado) quando a grade passa da barra de abas
  const gradeRef = useRef(null)
  const gradeNaTela = useInView(gradeRef, { once: true, margin: '0px 0px -100px 0px' })

  return (
    <motion.div
      variants={cascata}
      initial="oculto"
      animate="visivel"
      className="pb-[calc(var(--altura-nav)+32px)]"
    >
      <motion.header
        variants={subir}
        className="topo-app-inicio flex items-center justify-between gap-3 px-5 pt-[max(env(safe-area-inset-top),16px)]"
      >
        <p className="flex min-w-0 items-center gap-2 rounded-full bg-cartao py-1.5 pr-4 pl-1.5 shadow-(--sombra-cartao)">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-tom-acompanhamentos text-texto">
            <MapPin size={14} strokeWidth={2.4} />
          </span>
          <span className="truncate text-[13px] font-semibold text-texto">
            {LOJA.bairro}
            <span className="font-normal text-texto-suave">, {LOJA.municipio}</span>
          </span>
        </p>
        <BotaoTema />
      </motion.header>

      <motion.div variants={subir} className="px-5 pt-7">
        <p className="font-script text-[25px] leading-none text-acento">
          <NotaGrifada>{saudacao()}</NotaGrifada>
        </p>
        <TituloRevelado texto="Bateu a fome?" className="titulo-app mt-1.5 text-[44px] text-texto" atraso={0.12} />
      </motion.div>

      <motion.div variants={subir} className="px-5 pt-5">
        <button
          type="button"
          onClick={() => navigate('/cardapio', { state: { buscar: true, topo: true } })}
          className="flex h-[52px] w-full items-center gap-3 rounded-2xl bg-cartao px-4 text-left text-[15px]
                     text-texto-suave shadow-(--sombra-cartao) transition active:scale-[0.99]"
        >
          <Search size={19} strokeWidth={2.2} className="text-texto" />
          Buscar lanche, bebida…
        </button>
      </motion.div>

      <motion.div variants={subir} className="pt-6">
        <Destaques itens={itens} />
      </motion.div>

      <motion.section variants={subir} className="px-5 pt-9">
        <TituloSecao nota="tá a fim de quê?" titulo="Categorias" />
        <div ref={gradeRef} className="mt-3.5 grid h-[252px] grid-cols-2 grid-rows-2 gap-3">
          <Ladrilho
            id="hamburgueres"
            ordem={0}
            gradeNaTela={gradeNaTela}
            sobe
            destaque
            nome="Hambúrgueres"
            quantos={quantos('hamburgueres')}
            className="row-span-2"
            arte={
              <span className="absolute right-[-10%] bottom-4 w-[92%] -rotate-6">
                <MiniBurger camadas={itens.find((i) => i.id === 'x-tudo')?.camadas} justo />
              </span>
            }
          />
          <Ladrilho
            id="acompanhamentos"
            ordem={1}
            gradeNaTela={gradeNaTela}
            topo
            // o hífen "invisível" (\u00AD) marca onde a palavra pode quebrar:
            // em tela de 320px ela vira "Acompanha-/mentos", em vez de o
            // navegador quebrar em qualquer letra
            nome={'Acompanha\u00ADmentos'}
            quantos={quantos('acompanhamentos')}
            arte={
              <span className="absolute right-2 bottom-[-6px] h-[74%] rotate-6">
                <Fritas completa className="block h-full w-auto overflow-visible" />
              </span>
            }
          />
          <Ladrilho
            id="bebidas"
            ordem={2}
            gradeNaTela={gradeNaTela}
            nome="Bebidas"
            quantos={quantos('bebidas')}
            arte={
              <span className="absolute right-3 bottom-[-4px] flex h-[76%] items-end gap-1">
                <Garrafinha cor="#1b7f3b" liquido="#a8561a" className="block h-[92%] w-auto overflow-visible -rotate-6" />
                <Lata cor="#d9241c" className="block h-[70%] w-auto overflow-visible rotate-3" />
              </span>
            }
          />
        </div>
      </motion.section>

      <motion.section variants={subir} className="pt-9">
        <TituloSecao
          nota="se não sabe o que pedir"
          titulo="Pra começar"
          className="px-5"
          acao={
            <Link to="/cardapio" state={{ topo: true }} className="flex items-center gap-1 text-[13.5px] font-semibold text-acento">
              Ver tudo <ArrowRight size={15} strokeWidth={2.4} />
            </Link>
          }
        />
        {/* a mesma fileira das etapas do combo: bandeja, seta, fade nas
            bordas e a espiada na primeira vez (ver Fileira.jsx) */}
        <Fileira rotulo="Pra começar" fadeDireita={36}>
          {maisPedidos.map((item) => (
            <CartaoGrade key={item.id} item={item} className="w-[156px] shrink-0 snap-start" />
          ))}
        </Fileira>
      </motion.section>
    </motion.div>
  )
}

// a nota de cima muda com a hora do dia
function saudacao() {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return 'bom dia!'
  if (hora >= 12 && hora < 18) return 'boa tarde!'
  return 'boa noite!'
}

/* ---- A TROCA DE TEMA DO APP ----
   Separada da do site (TemaContext): o app nasce claro. O ícone mostra pra
   onde você VAI (sol no escuro, lua no claro), e o tema novo cresce num
   círculo a partir do botão. */
function BotaoTema() {
  const { tema, alternar } = useTema()
  const escuro = tema === 'escuro'

  const aoTocar = (e) => {
    const caixa = e.currentTarget.getBoundingClientRect()
    alternar({ x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 })
  }

  return (
    <motion.button
      type="button"
      onClick={aoTocar}
      whileTap={{ scale: 0.86 }}
      aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-cartao text-texto shadow-(--sombra-cartao)"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={tema}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="grid place-items-center"
        >
          {escuro ? <Sun size={20} strokeWidth={2.2} /> : <Moon size={19} strokeWidth={2.2} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

/* ---- OS DOIS CARTÕES GRANDES ----
   Uma fileira de lado, com o próximo cartão aparecendo na beira (é o
   convite pra arrastar). O desenho de cada cartão anda MAIS DEVAGAR que o
   cartão quando você arrasta (paralaxe) — dá profundidade: a comida parece
   estar na frente do cartão, não pintada nele. */
function Destaques({ itens }) {
  const navigate = useNavigate()
  const { abrir } = useItemAberto()
  const menos = useMenosMovimento()
  const trilho = useRef(null)
  const { scrollXProgress } = useScroll({ container: trilho })
  const arte1 = useTransform(scrollXProgress, [0, 1], [0, -44])
  const arte2 = useTransform(scrollXProgress, [0, 1], [44, 0])

  const porId = (id) => itens.find((item) => item.id === id)
  const lancheDoCombo = porId('x-burguer-artesanal')
  const completo = porId('x-tudo-artesanal')

  return (
    <div
      ref={trilho}
      className="sem-barra flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pt-5 pb-4"
    >
      {/* 1. MONTE SEU COMBO — o vermelho da casa */}
      <button
        type="button"
        onClick={() => navigate('/combo')}
        className="relative h-[196px] w-[88%] shrink-0 snap-start rounded-[28px] bg-botao text-left text-white
                   shadow-(--sombra-botao) transition-transform active:scale-[0.985]"
      >
        <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_82%_38%,rgb(255_255_255/0.24),transparent_58%)]" />
          <Gergelim />
        </span>

        <span className="relative flex h-full max-w-[58%] flex-col p-5">
          <span className="font-script text-[24px] leading-none text-[#ffe28a]">é o nome da casa</span>
          <span className="titulo-app mt-1.5 text-[29px]">Monte seu combo</span>
          <span className="mt-1.5 text-[13px] leading-snug">Lanche do seu jeito.</span>
          <BotaoMontar menos={menos} />
        </span>

        {/* a comida passa da borda de cima do cartão; a batata e a lata
            ORBITAM o hambúrguer (Orbita, lá embaixo) */}
        <motion.span
          aria-hidden="true"
          style={{ x: menos ? 0 : arte1 }}
          className="pointer-events-none absolute right-1 bottom-4 block w-[50%]"
        >
          <Orbita lanche={lancheDoCombo} />
        </motion.span>
      </button>

      {/* 2. O MAIS COMPLETO — no amarelo do pão */}
      {completo && (
        <button
          type="button"
          onClick={() => abrir(completo.id)}
          className="relative h-[196px] w-[88%] shrink-0 snap-start rounded-[28px] bg-tom-hamburgueres text-left
                     text-texto shadow-(--sombra-cartao) transition-transform active:scale-[0.985]"
        >
          <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_40%,var(--luz-vitrine),transparent_60%)]" />
          </span>

          <span className="relative flex h-full max-w-[56%] flex-col p-5">
            {/* vermelho em cima do amarelo dá 4,2:1 — passa porque a letra é
                grande (24px); menor que isso, teria que ser a cor de texto */}
            <span className="font-script text-[24px] leading-none text-acento">o mais completo</span>
            <span className="titulo-app mt-1.5 text-[29px]">{completo.nome}</span>
            <span className="mt-1.5 text-[15px] font-bold tabular-nums">{formatarPreco(completo.preco)}</span>
            <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-texto px-3.5 py-2 text-[13px] font-bold text-fundo">
              Ver lanche <ArrowRight size={15} strokeWidth={2.6} />
            </span>
          </span>

          <motion.span
            aria-hidden="true"
            style={{ x: menos ? 0 : arte2 }}
            className="pointer-events-none absolute right-3 bottom-5 block w-[42%]"
          >
            <span className="animate-flutua block rotate-6 drop-shadow-[0_14px_14px_var(--sombra-burger)]">
              <MiniBurger camadas={completo.camadas} justo />
            </span>
          </motion.span>
        </button>
      )}
    </div>
  )
}

/* ---- O "MONTAR" DO CARTÃO DO COMBO ----
   Quando o Início aparece, o botão chama atenção uma vez: a seta dá duas
   piscadas pra direita ("vai por aqui") e o botão ESTICA pra direita junto
   com cada uma — só pra direita, na direção da seta: o que cresce é o
   espaço à direita (padding-right), não o botão inteiro (um scale incharia
   pra cima e pra baixo também). Espera a entrada da tela terminar (ATRASO_MONTAR) e
   não repete — um botão que pisca pra sempre vira ruído. Com menos
   movimento, fica parado. É um <span> (o cartão inteiro já é o botão). */
const ATRASO_MONTAR = 1.1
const PISCADAS = { duration: 1.1, times: [0, 0.22, 0.45, 0.67, 1], ease: 'easeInOut' }

function BotaoMontar({ menos }) {
  return (
    <motion.span
      initial={false}
      // 14px é o pr-3.5 de sempre; nas piscadas vai a 22px
      style={{ paddingRight: 14 }}
      animate={menos ? {} : { paddingRight: [14, 22, 14, 22, 14] }}
      transition={{ ...PISCADAS, delay: ATRASO_MONTAR }}
      className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white py-2 pl-3.5 text-[13px] font-bold
                 text-botao"
    >
      Montar
      <motion.span
        initial={false}
        animate={menos ? {} : { x: [0, 5, 0, 5, 0] }}
        transition={{ ...PISCADAS, delay: ATRASO_MONTAR }}
        className="flex"
      >
        <ArrowRight size={15} strokeWidth={2.6} />
      </motion.span>
    </motion.span>
  )
}

/* ---- A ÓRBITA DO CARTÃO DO COMBO ----
   A batata e a lata giram em volta do hambúrguer, devagar, numa elipse
   deitada (larga e baixinha) — vista de lado, como um prato girando:
     na frente   mais embaixo, tamanho cheio, POR CIMA do hambúrguer
     atrás       mais em cima, menor, POR TRÁS dele
   As duas em lados opostos da elipse (meia volta de diferença): quando a
   batata passa na frente, a lata passa atrás. Cada uma inclina pra fora
   (a batata pra esquerda, a lata pra direita) conforme o lado em que está.

   Um ângulo só (theta) move as duas. Ele anda a cada quadro da tela
   (useAnimationFrame) — mas só com o cartão NA TELA (useInView): em outra
   aba ou rolado pra longe, a órbita para e não gasta bateria. Com menos
   movimento, fica parada na pose de antes (batata à esquerda, lata à
   direita). */
const VOLTA_MS = 11000 // uma volta inteira
const RAIO_X = 54 // px, pros lados
const RAIO_Y = 9 // px, pra cima/baixo (a profundidade)

function Orbita({ lanche }) {
  const caixaRef = useRef(null)
  const menos = useMenosMovimento()
  const naTela = useInView(caixaRef)
  // começa com a batata à esquerda e a lata à direita, as duas de lado
  const theta = useMotionValue(0)

  useAnimationFrame((_, delta) => {
    if (menos || !naTela) return
    theta.set(theta.get() + (delta / VOLTA_MS) * Math.PI * 2)
  })

  return (
    <span ref={caixaRef} className="relative block">
      <span className="animate-flutua relative z-10 mx-auto block w-[64%] drop-shadow-[0_12px_14px_rgb(0_0_0/0.3)]">
        {lanche && <MiniBurger camadas={lanche.camadas} justo />}
      </span>

      <Satelite theta={theta} fase={Math.PI} altura={84}>
        <Fritas className="block h-full w-auto overflow-visible drop-shadow-[0_8px_10px_rgb(0_0_0/0.25)]" />
      </Satelite>
      <Satelite theta={theta} fase={0} altura={66}>
        <Lata cor="#d9241c" className="block h-full w-auto overflow-visible drop-shadow-[0_8px_10px_rgb(0_0_0/0.25)]" />
      </Satelite>
    </span>
  )
}

/* Um item em órbita. `fase` é onde ele está na elipse quando theta = 0:
   π = esquerda, 0 = direita. Tudo sai de um ângulo só:
     x      cos → de um lado pro outro
     prof.  sin → +1 na frente, -1 atrás */
function Satelite({ theta, fase, altura, children }) {
  const angulo = useTransform(theta, (t) => t + fase)
  const x = useTransform(angulo, (a) => Math.cos(a) * RAIO_X)
  const y = useTransform(angulo, (a) => Math.sin(a) * RAIO_Y)
  const scale = useTransform(angulo, (a) => 0.86 + 0.14 * ((Math.sin(a) + 1) / 2))
  const rotate = useTransform(angulo, (a) => Math.cos(a) * 12)
  // na frente do hambúrguer (z 10) ou atrás dele
  const zIndex = useTransform(angulo, (a) => (Math.sin(a) > 0 ? 20 : 0))

  return (
    // largura ZERO no centro do hambúrguer, com o desenho centralizado nela
    // (vaza igual pros dois lados): o giro e a escala acontecem em volta do
    // pé do desenho, e o x da órbita não briga com um translate de centrar
    <motion.span
      className="absolute bottom-[4%] left-1/2 flex w-0 origin-bottom justify-center"
      style={{ height: altura, x, y, scale, rotate, zIndex }}
    >
      <span className="block h-full shrink-0">{children}</span>
    </motion.span>
  )
}

/* Gergelim no cartão vermelho: sementes claras boiando devagar. As
   trajetórias (deriva-a/b/c) são as mesmas do gergelim da hero do site
   (index.css); com menos movimento, a regra global para tudo. */
const SEMENTES = [
  { x: 6, y: 16, giro: -20, rota: 'a', dur: 7 },
  { x: 41, y: 9, giro: 35, rota: 'b', dur: 9 },
  { x: 57, y: 64, giro: -50, rota: 'c', dur: 8 },
  { x: 24, y: 84, giro: 15, rota: 'a', dur: 10 },
  { x: 88, y: 14, giro: 70, rota: 'b', dur: 7.5 },
  { x: 70, y: 36, giro: -10, rota: 'c', dur: 9.5 },
]

function Gergelim() {
  return (
    <span aria-hidden="true" className="absolute inset-0">
      {SEMENTES.map((s, i) => (
        <span
          key={i}
          className="absolute block"
          style={{ left: `${s.x}%`, top: `${s.y}%`, animation: `deriva-${s.rota} ${s.dur}s ease-in-out infinite` }}
        >
          <svg width="11" height="6" viewBox="0 0 20 11" style={{ rotate: `${s.giro}deg` }}>
            <path d="M0.5 5.5 Q5 0 12 1.2 Q19.5 3 19.5 5.5 Q19.5 8 12 9.8 Q5 11 0.5 5.5 Z" fill="#fff6dc" fillOpacity="0.55" />
          </svg>
        </span>
      ))}
    </span>
  )
}

/* ---- UM LADRILHO DE CATEGORIA ----
   Tocar leva pro Cardápio já filtrado. O desenho dá um pulinho no toque
   (whileTap do ladrilho passa pro desenho pela variante "apertado").

   O TEXTO fica no meio do ladrilho, por cima do desenho — no claro, a
   comida colorida por trás das letras escuras fica bonita. No ESCURO, as
   letras claras em cima do pão amarelo e das batatas ficam estranhas:
   nos ladrilhos com `sobe` (Hambúrgueres e Acompanhamentos), o texto
   desliza pro topo e sai de cima do desenho. Bebidas fica no meio nos dois
   temas (as garrafas estão de lado, não passam por baixo do texto).
   A subida é CSS (.ladrilho-texto no index.css): anima sozinha na troca
   de tema, enquanto o círculo do tema novo cresce pela tela.

   A TIPOGRAFIA (o "cru" que o Marco apontou), com duas marcas do site:
     o número   a contagem ("05", "19") GIGANTE e vazada, em Oswald — os
                números "01, 02…" da seção de burgers do desktop. Fica
                ATRÁS do desenho (a comida passa na frente, efeito de
                cartaz em camadas), no canto de cima. Só no tema claro:
                no escuro ele some (.ladrilho-numero no index.css).
     o grifo    o traço de marca-texto do site passa por trás do nome, da
                esquerda pra direita, quando o ladrilho aparece.
   `destaque`: o ladrilho alto (Hambúrgueres) — nome maior.
   `topo`: o nome fica no TOPO nos dois temas, e o número desce pra baixo
   dele (Acompanhamentos — pedido do Marco). */
function Ladrilho({ id, nome, quantos, arte, ordem = 0, gradeNaTela = false, sobe = false, topo = false, destaque = false, className = '' }) {
  const navigate = useNavigate()
  const menos = useMenosMovimento()

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/cardapio?cat=${id}`, { state: { topo: true } })}
      whileTap="apertado"
      variants={{ apertado: { scale: 0.97 } }}
      data-sobe={sobe || undefined}
      data-topo={topo || undefined}
      data-categoria={id}
      className={`ladrilho relative overflow-hidden rounded-3xl text-left ${TOM[id]} ${className}`}
    >
      {/* o número vazado: antes do desenho no HTML = atrás dele na tela */}
      <NumeroVazado quantos={quantos} ordem={ordem} mostrar={gradeNaTela} destaque={destaque} />

      <span className="ladrilho-texto absolute inset-x-4 z-10 block">
        {/* Condensada (font-stretch 76%) e encolhendo com a tela: o nome
            inteiro cabe no ladrilho até em celular de 360px. Menor que isso,
            "Acompanhamentos" quebra no hífen marcado no nome (ver o ladrilho
            dele), em vez de ser cortado.
            O grifo é um degradê de fundo que cresce de 0 a 100% da largura
            (a mesma técnica do .grifo do site); o box-decoration-break faz
            ele acompanhar a quebra de linha, se houver. */}
        <span
          className={`titulo-app block leading-[1.02] text-texto [font-stretch:76%]
                      ${destaque ? 'text-[clamp(19px,5.6vw,23px)]' : 'text-[clamp(15.5px,4.8vw,18px)]'}`}
        >
          <motion.span
            className="grifo-ladrilho"
            initial={menos ? false : { backgroundSize: '0% 42%' }}
            whileInView={{ backgroundSize: '100% 42%' }}
            viewport={{ once: true, margin: '0px 0px -100px 0px' }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {nome}
          </motion.span>
        </span>
        <Opcoes quantos={quantos} />
      </span>
      <motion.span
        aria-hidden="true"
        variants={{ apertado: { y: -6, rotate: -4 } }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="absolute inset-0"
      >
        {arte}
      </motion.span>
    </motion.button>
  )
}

/* ---- O NÚMERO VAZADO DO LADRILHO ----
   Os três surgem EM ORDEM — Hambúrgueres, Acompanhamentos, Bebidas — um
   gatilho só (a grade entrando na tela, lá no Inicio) e um atraso por
   posição (ENTRE_NUMEROS). Cada um:
     1. entra subindo e GIRANDO um tico até assentar na inclinação dele
        (a inclinação e o "vazar da borda": .ladrilho-numero no index.css);
     2. CONTA de 0 até a quantidade — o CountUp do ReactBits (a mola dele:
        rápido no começo, freando no fim), um tico depois de aparecer.
   O CountUp não tem zero à esquerda: nos números de um dígito, o "0" da
   frente é fixo e ele conta só o segundo ("00" → "05"). O 19 conta de 0 a
   19. Com menos movimento, o número já nasce pronto, sem entrar nem contar. */
const ATRASO_NUMERO = 0.15
const ENTRE_NUMEROS = 0.35

function NumeroVazado({ quantos, ordem, mostrar, destaque }) {
  const menos = useMenosMovimento()
  const atraso = ATRASO_NUMERO + ordem * ENTRE_NUMEROS

  return (
    <motion.span
      aria-hidden="true"
      initial={menos ? false : { opacity: 0, y: 22, rotate: -14, scale: 0.9 }}
      animate={menos || mostrar ? { opacity: 1, y: 0, rotate: 0, scale: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 120, damping: 14, delay: atraso }}
      className={`ladrilho-numero absolute leading-none tabular-nums
                  ${destaque ? 'text-[112px]' : 'text-[74px]'}`}
    >
      {menos ? (
        String(quantos).padStart(2, '0')
      ) : (
        <>
          {quantos < 10 && '0'}
          <CountUp to={quantos} from={0} duration={1.1} delay={atraso + 0.1} startWhen={mostrar} />
        </>
      )}
    </motion.span>
  )
}

/* ---- O "5 OPÇÕES" DO LADRILHO, COM O RAMO ----
   O ramo sai do nome e aponta pro "5 opções" (cinza e mais fino no claro,
   branco e grosso no escuro — .ramo-opcoes no index.css). Pedido do Marco:
   a linha ENTRA em três tempos, na primeira vez que aparece na tela:
     1. o texto está onde estaria SEM o ramo — colado na esquerda, alinhado
        com o nome da categoria. Fica ali um instante (ESPERA);
     2. anda pra direita, abrindo o vão do ramo (ANDA)...
     3. ...e o ramo se DESENHA no vão: desce do nome e vira pro texto.
   O ramo está no lugar dele desde o começo, só invisível; quem anda é o
   texto, por transform (x) — animar a largura do ramo faria o navegador
   recalcular o layout a cada quadro (a mesma regra do .ladrilho-texto).

   `viewport.margin`: o gatilho só dispara quando o texto passa da barra de
   abas (fixa em cima da parte de baixo da tela) — senão a animação rodaria
   escondida atrás dela.

   Menos movimento (sistema ou modo leve): as durações viram zero e tudo vai
   direto pro fim. Não dá pra só tirar o whileInView: se o modo leve ligar
   DEPOIS da montagem (a aba Início fica montada), o texto ficaria preso no
   passo 1. */
const RAMO = 16 // altura do ramo, em px
const ABRE = RAMO * (14 / 18) + 4 // o texto anda a largura do ramo (proporção do IconeRamo) + o gap-1
const ESPERA = 0.6
const ANDA = 0.5
const DESENHA = 0.45

function Opcoes({ quantos }) {
  const menos = useMenosMovimento()
  const quando = (delay, duration, ease) => (menos ? { duration: 0 } : { delay, duration, ease })
  // o ramo começa a se desenhar quando o texto já está quase parado: a curva
  // (a mesma --ease-mordida do CSS) freia no fim, e com 60% do tempo ele já
  // andou quase tudo
  const desenhaEm = ESPERA + ANDA * 0.6

  return (
    <motion.span
      initial={menos ? false : 'antes'}
      whileInView="depois"
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      className="opcoes-ladrilho mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-texto/75"
    >
      <IconeRamo
        size={RAMO}
        // traço fino (o padrão do ícone é 2,6): pedido do Marco, nos dois temas
        strokeWidth={1.7}
        className="ramo-opcoes"
        variantesTraco={{
          // opacity junto: com pathLength 0, a ponta redonda ainda
          // desenharia um pontinho no começo do traço
          antes: { pathLength: 0, opacity: 0 },
          depois: {
            pathLength: 1,
            opacity: 1,
            transition: { pathLength: quando(desenhaEm, DESENHA, 'easeInOut'), opacity: quando(desenhaEm, 0.01) },
          },
        }}
      />
      <motion.span
        variants={{
          antes: { x: -ABRE },
          depois: { x: 0, transition: quando(ESPERA, ANDA, [0.22, 1, 0.36, 1]) },
        }}
      >
        {quantos} opções
      </motion.span>
    </motion.span>
  )
}

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react'
import { ArrowUpRight, House, Layers, MapPin, Sandwich, UtensilsCrossed } from 'lucide-react'
import { LOJA } from '@/data/cardapio'
import { LINK_CARDAPIO, LINKS_NAV, useLinkAtivo } from '@/hooks/useLinkAtivo'
import { useProximidade } from '@/hooks/useProximidade'
import Logo, { LogoMontando } from '@/components/Logo'
import IconeInstagram from '@/components/IconeInstagram'
import Interruptor from '@/components/Interruptor'
import { useModoLeve } from '@/context/ModoLeveContext'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   NAV RAIL — navegação do DESKTOP, colada na direita
   ----------------------------------------------------------------------------
   FECHADO  a pílula de vidro de sempre: só os ícones, um pouco acima do
            meio da tela (top 47% — no meio exato ela parecia baixa).
   ABERTO   (mouse em cima, ou Tab chegando nela) a pílula ESTICA até virar
            um painel da altura da tela, GRUDADO na borda direita: fino nas
            pontas, gordo no meio, onde estão os itens — o desenho que você
            fez no Paint. As pontas passam da tela em cima e embaixo, então
            o que se vê é uma faixa fina correndo pela borda que incha no
            meio. O resto da página ganha um véu (desfoque + escurecido) e a
            nav fica em foco.

   A FORMA
   Um caminho SVG só (desenharForma, lá embaixo) com a mesma estrutura nos
   dois estados:

       tampa de cima   ╭╮       meia-lua; o raio é metade da largura fina
       curva em S       ╲       sai fina e abre até a largura da barriga
       barriga          │       reta, da altura dos itens
       curva em S       ╱
       tampa de baixo  ╰╯

   Fechado, a parte fina e a barriga têm a mesma largura (62px) e as
   curvas têm altura zero: sobra exatamente a pílula. Como a estrutura é a
   mesma, dá pra ir de um estado pro outro só mudando os números — e é uma
   MOLA (Motion) que muda. As pontas saem na frente (e a pílula encosta na
   borda junto com elas) e a barriga enche logo atrás: duas curvas de
   aceleração diferentes sobre o mesmo progresso, que é o que dá o jeito de
   líquido esticando.

   O VIDRO
   O desfoque (backdrop-filter) é de uma <div> recortada pelo mesmo caminho
   (clip-path: path()). O recorte vale pro MOUSE também: fora da forma
   nada é clicável, então a área que abre o menu é a pílula, e a área que
   o mantém aberto é o painel inteiro. Os itens moram dentro dessa div —
   nenhum texto aparece fora do vidro nem por um quadro.

   A SINCRONIA
   A mesma mola escreve --abertura (0 → 1) no <nav>. O véu, o surgimento de
   cada item e o comprimento dos divisores leem essa variável no CSS
   (index.css, bloco TRILHO) — tudo anda colado na forma, sem transição de
   tempo chutado. Se o mouse sai no meio da abertura, tudo volta junto do
   ponto em que estava.

   A LISTA
   O LineSidebar do ReactBits (barra de 60px, deslize de 30px, curva
   smooth, suavidade de 100ms, tracinhos de metade da barra, número em
   fonte mono), reescrito dentro do trilho: o original não tem link, nem
   teclado, nem ícone, e tem o hover travado.

   Versão MINIMALISTA, num branco acinzentado quase imperceptível — mas lá:
   - a barra grande, o número e o texto de um item só acendem com o mouse
     EM CIMA dele (o texto clareia e desliza);
   - quem sente o mouse chegando são só os TRACINHOS entre os itens: os
     dois colados no item sob o mouse acendem e crescem; os outros ficam
     quietos.
   A seção atual não acende nada: quem mostra "você está aqui" é a bolha no
   ícone, e o texto dela já vem claro.

   O espaço entre os itens é o dos ícones da pílula (50px de um item pro
   outro), não os 20px do exemplo: os ícones não podem pular de lugar
   quando o painel abre.

   O efeito mora no hook useProximidade, que também corrige o hover travado
   do original. As cores estão no index.css, bloco TRILHO.
   ========================================================================== */

// os destinos do site (hooks/useLinkAtivo.js), cada um com seu ícone
const ICONES = {
  inicio: House,
  burgers: Sandwich,
  combo: Layers,
  contato: MapPin,
}

/* ---- geometria (px) ---- */
const PILULA = 62 // largura do trilho fechado: 44 do ícone + 2×8 de respiro + 2×1 de borda
const BARRIGA = 360 // da borda direita da pílula até onde a parte gorda chega, aberta
const FINO = 14 // largura das pontas, aberta (a faixa que corre pela borda da tela)
const ALEM = 40 // quanto as pontas passam da tela, em cima e embaixo
const FOLGA = 16 // quanto a barriga passa dos itens, em cima e embaixo
/* e mais este tanto em cima: a logo grande (120px) sobe ~65px além da
   coluna, e a curva começa ~12px acima dela — perto, sem encostar */
const CABECA = 60
const RECUO = 16 // distância da pílula até a borda da tela (right-4)
const LARGURA_NAV = RECUO + BARRIGA + 4 // caixa onde tudo é desenhado

/* Formato da curva em S. Os pontos de controle ficam a TENSAO × altura da
   curva das pontas: 0.5 é um S comum; perto de 1 ela segue fina por mais
   tempo e vira de uma vez. */
const TENSAO = 0.6

/* ---- tempo ---- */
// molas sem quique (amortecimento crítico): chegam macias, não balançam
const MOLA_ABRIR = { type: 'spring', stiffness: 210, damping: 29 }
const MOLA_FECHAR = { type: 'spring', stiffness: 300, damping: 35 }
// o mouse precisa PARAR um instante na pílula pra ela abrir: passar por
// cima a caminho de outro lugar não escurece a página inteira
const ESPERA_ABRIR = 80
// e sair por um instante (pela curva, sem querer) não fecha na hora
const ESPERA_FECHAR = 140

const limitar = (p) => Math.min(Math.max(p, 0), 1)
const lerp = (a, b, t) => a + (b - a) * t
const pontas = (p) => 1 - (1 - p) ** 3 // as pontas saem na frente…
const barriga = (p) => p * p * (3 - 2 * p) // …e a barriga enche logo atrás

/* Desenha a forma com progresso p (0 fechado, 1 aberto). `g` é a medida
   na tela: topo e base da coluna dos itens, borda direita da pílula,
   largura e altura da caixa do trilho. */
function desenharForma(p, g) {
  const t = limitar(p)
  const eP = pontas(t)
  const eB = barriga(t)

  // as três bordas, em x:
  // xr  direita — sai da pílula e encosta na tela (1px além, pra linha da
  //     borda do vidro não aparecer ali)
  // xf  da parte fina — fica a FINO da borda da tela
  // xg  da barriga — vai até onde a coluna dos itens começa
  const xr = lerp(g.direita, g.largura + 1, eP)
  const xf = lerp(g.direita - PILULA, g.largura - FINO, eP)
  const xg = lerp(g.direita - PILULA, g.direita - BARRIGA, eB)
  const raio = (xr - xf) / 2
  // alça de 4/3 do raio: uma curva cúbica só, quase idêntica a um semicírculo
  const alca = (4 / 3) * raio

  // onde a barriga começa e termina, aberta
  const cimaAberta = Math.max(g.topo - FOLGA - CABECA, 0)
  const baixoAberta = Math.min(g.base + FOLGA, g.altura)

  const y0 = lerp(g.topo, -ALEM, eP) + raio // fim da tampa de cima
  const y3 = lerp(g.base, g.altura + ALEM, eP) - raio // começo da de baixo
  const yA = lerp(g.topo + PILULA / 2, cimaAberta, eP) // começo da barriga
  const yB = lerp(g.base - PILULA / 2, baixoAberta, eP) // fim da barriga
  const k1 = TENSAO * (yA - y0)
  const k2 = TENSAO * (y3 - yB)

  const n = (v) => Math.round(v * 100) / 100

  return (
    `M${n(xr)} ${n(y0)}` +
    `C${n(xr)} ${n(y0 - alca)} ${n(xf)} ${n(y0 - alca)} ${n(xf)} ${n(y0)}` +
    `C${n(xf)} ${n(y0 + k1)} ${n(xg)} ${n(yA - k1)} ${n(xg)} ${n(yA)}` +
    `L${n(xg)} ${n(yB)}` +
    `C${n(xg)} ${n(yB + k2)} ${n(xf)} ${n(y3 - k2)} ${n(xf)} ${n(y3)}` +
    `C${n(xf)} ${n(y3 + alca)} ${n(xr)} ${n(y3 + alca)} ${n(xr)} ${n(y3)}Z`
  )
}

export default function NavRail() {
  const [aberto, setAberto] = useState(false)
  const { pathname, hash } = useLocation()
  const estaAtivo = useLinkAtivo()
  const reduzir = useMenosMovimento()
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  const navRef = useRef(null)
  const colunaRef = useRef(null)
  const sombraRef = useRef(null)
  const medida = useRef(null)
  const espera = useRef(null)

  const progresso = useMotionValue(0)
  const forma = useMotionValue('')
  // "M0 0" = recorte vazio: antes da primeira medida, nada aparece
  const recorte = useTransform(forma, (d) => (d ? `path('${d}')` : "path('M0 0')"))
  const abertura = useTransform(progresso, (p) => barriga(limitar(p)))

  // a cada quadro da mola, redesenha a forma
  useMotionValueEvent(progresso, 'change', (p) => {
    if (medida.current) forma.set(desenharForma(p, medida.current))
  })

  /* Mede onde os itens estão (a forma se ajusta a eles). O ResizeObserver
     refaz a medida quando a janela muda de altura ou a coluna de tamanho —
     e também quando o trilho sai do display:none, ao alargar a janela. */
  useLayoutEffect(() => {
    const nav = navRef.current
    const coluna = colunaRef.current
    const sombra = sombraRef.current

    const medir = () => {
      const caixaNav = nav.getBoundingClientRect()
      const caixa = coluna.getBoundingClientRect()
      if (!caixaNav.height || !caixa.height) return // escondido (celular)

      medida.current = {
        topo: caixa.top - caixaNav.top,
        base: caixa.bottom - caixaNav.top,
        direita: caixa.right - caixaNav.left,
        largura: caixaNav.width,
        altura: caixaNav.height,
      }
      sombra.style.top = `${medida.current.topo}px`
      sombra.style.height = `${caixa.height}px`
      forma.set(desenharForma(progresso.get(), medida.current))
    }

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nav)
    observador.observe(coluna)
    return () => observador.disconnect()
  }, [forma, progresso])

  // abre/fecha: a mola parte de onde estiver, com a velocidade que tiver
  useEffect(() => {
    const alvo = aberto ? 1 : 0
    if (reduzir) {
      progresso.jump(alvo)
      return
    }
    const controle = animate(progresso, alvo, aberto ? MOLA_ABRIR : MOLA_FECHAR)
    return () => controle.stop()
  }, [aberto, reduzir, progresso])

  // navegou? recolhe
  useEffect(() => {
    clearTimeout(espera.current)
    setAberto(false)
  }, [pathname, hash])

  useEffect(() => () => clearTimeout(espera.current), [])

  const agendar = (valor, ms) => {
    clearTimeout(espera.current)
    espera.current = setTimeout(() => setAberto(valor), ms)
  }

  const secoes = LINKS_NAV.map((link, i) => ({
    ...link,
    Icone: ICONES[link.id],
    indice: String(i + 1).padStart(2, '0'),
    ativo: estaAtivo(link),
  }))
  const cardapioAtivo = estaAtivo(LINK_CARDAPIO)

  /* raio 80: com o mouse no meio de um item, os dois tracinhos colados
     nele ficam a 25px (acendem ~77%) e os seguintes a 75px (quase nada).
     Suavidade 100ms: a do seu LineSidebar. */
  const { registrarItem, registrarTique, aoMover, aoSair } = useProximidade({
    raio: 80,
    suavidade: reduzir ? 1 : 100,
  })

  // fechou: apaga o rastro do mouse
  useEffect(() => {
    if (!aberto) aoSair()
  }, [aberto, aoSair])

  return (
    <motion.nav
      ref={navRef}
      aria-label="Navegação principal"
      data-aberto={aberto}
      // z 55: acima da sacola e do botão de tema (50, ficam sob o véu),
      // abaixo do modal do item (60) e do carrinho (70)
      className="group/rail pointer-events-none fixed inset-y-0 right-0 z-[55] hidden md:block"
      style={{ width: LARGURA_NAV, '--abertura': abertura }}
      onMouseEnter={() => agendar(true, ESPERA_ABRIR)}
      onMouseLeave={() => agendar(false, ESPERA_FECHAR)}
      onPointerMove={(e) => aberto && aoMover(e)}
      // teclado: abre quando o foco entra, fecha quando ele SAI do trilho
      // inteiro (e não só pula de um link pro outro lá dentro)
      onFocus={() => {
        clearTimeout(espera.current)
        setAberto(true)
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return
        clearTimeout(espera.current)
        setAberto(false)
      }}
    >
      {/* véu sobre a página inteira. A opacidade vem da --abertura (CSS);
          o visibility desliga o desfoque de vez quando está fechado — um
          backdrop-filter de tela cheia transparente ainda custaria caro. */}
      <div
        aria-hidden="true"
        className="trilho-veu pointer-events-none invisible fixed inset-0 bg-(--veu) backdrop-blur-[6px]
                   transition-[visibility] delay-500
                   group-data-[aberto=true]/rail:visible group-data-[aberto=true]/rail:delay-0"
      />

      {/* sombra da pílula fechada. Fica FORA do recorte (senão seria
          cortada junto) e some assim que a forma começa a crescer. */}
      <div
        ref={sombraRef}
        aria-hidden="true"
        className="trilho-sombra pointer-events-none absolute right-4 w-[62px] rounded-full shadow-(--sombra-flutuante)"
      />

      {/* ---- o vidro, recortado pela forma. Tudo daqui pra dentro só
          existe (e só recebe mouse) dentro dela. ---- */}
      <motion.div
        className="pointer-events-auto absolute inset-0 backdrop-blur-[24px] backdrop-saturate-190"
        style={{ clipPath: recorte }}
      >
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
          <defs>
            {/* o degradê do vidro-forte: mais luz em cima, quase nada embaixo */}
            <linearGradient id={`${id}vidro`} x1="0.35" y1="0" x2="0.65" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--vf-luz)' }} />
              <stop offset="0.6" style={{ stopColor: 'var(--vf-fundo)' }} />
            </linearGradient>
            {/* o filete de luz atravessando na diagonal — é o detalhe que
                faz o olho ler "vidro" e não "caixa translúcida" */}
            <linearGradient id={`${id}reflexo`} x1="0" y1="0.3" x2="1" y2="0.7">
              <stop offset="0.28" style={{ stopColor: 'transparent' }} />
              <stop offset="0.42" style={{ stopColor: 'var(--vf-hover)' }} />
              <stop offset="0.58" style={{ stopColor: 'transparent' }} />
            </linearGradient>
            {/* borda: acesa em cima (a quina pegando luz), discreta no resto */}
            <linearGradient id={`${id}aro`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--vf-brilho)' }} />
              <stop offset="0.1" style={{ stopColor: 'var(--vf-borda)' }} />
            </linearGradient>
          </defs>
          <motion.path d={forma} fill={`url(#${id}vidro)`} />
          <motion.path d={forma} fill={`url(#${id}reflexo)`} />
          {/* 2px porque o recorte come a metade de fora: sobra 1px de borda */}
          <motion.path d={forma} fill="none" stroke={`url(#${id}aro)`} strokeWidth={2} />
        </svg>

        {/* ---- a coluna dos itens: parada no lugar, aberta ou fechada.
            Os ícones ficam na direita (dentro da pílula); o resto só
            aparece quando a barriga chega até ele. ---- */}
        <div
          ref={colunaRef}
          className="absolute top-[47%] right-4 flex -translate-y-1/2 flex-col items-end gap-1.5 py-[9px] pr-[9px] pl-6"
          style={{ width: BARRIGA }}
        >
          {/* ---- marca: só a logo ----
              Fechado: a logo colorida no disco, dentro da pílula.
              Aberto: ela some, e no lugar entra a logo CINZA, grande,
              centralizada acima do divisor — e se montando (pão de cima
              caindo, o de baixo subindo, fechando no COMBO) a cada
              abertura. Ela passa um pouco pra cima da coluna; a forma dá
              esse espaço (CABECA). */}
          <Link
            to="/"
            aria-label={`${LOJA.nome} — início`}
            className="relative flex w-full items-center justify-end rounded-full"
          >
            <span className="trilho-logo-pilula">
              <Logo circulo className="size-11" />
            </span>
            <span
              aria-hidden="true"
              className="trilho-logo-grande pointer-events-none absolute bottom-[14px] left-1/2 w-[120px] -translate-x-1/2"
            >
              <LogoMontando montada={aberto} />
            </span>
          </Link>

          <Divisor />

          {/* ---- seções da landing ---- */}
          {secoes.map((secao, i) => (
            <Linha
              key={secao.id}
              ordem={i + 1}
              registrarItem={registrarItem(i)}
              registrarTique={registrarTique(i)}
              para={secao.para}
              rotulo={secao.rotulo}
              indice={secao.indice}
              Icone={secao.Icone}
              ativo={secao.ativo}
              tique={i < secoes.length - 1}
            />
          ))}

          <Divisor />

          {/* ---- CARDÁPIO e Instagram ----
              Fora do grupo das seções: são outros LUGARES, não pontos da
              landing — por isso sem número, com a setinha de "abre outro
              lugar". Estando no cardápio, ele recebe o mesmo realce (mesmo
              layoutId): a bolha desce das seções até ele. */}
          <Linha
            ordem={secoes.length + 1}
            registrarItem={registrarItem(secoes.length)}
            registrarTique={registrarTique(secoes.length)}
            para={LINK_CARDAPIO.para}
            rotulo={LINK_CARDAPIO.rotulo}
            Icone={UtensilsCrossed}
            ativo={cardapioAtivo}
            seta
            tique
          />
          <Linha
            ordem={secoes.length + 2}
            registrarItem={registrarItem(secoes.length + 1)}
            externo
            para={LOJA.instagram}
            rotulo="Instagram"
            rotuloAcessivel="Instagram do Combo Lanches"
            Icone={IconeInstagram}
            seta
          />

          <Divisor />

          {/* ---- ANIMAÇÕES (modo leve) ----
              Não é destino: é um ajuste. Por isso vem depois de tudo,
              separado por divisor, mais baixo que os itens (h-8, não 44px)
              e sem ícone — fechado, é só a chavinha. */}
          <LinhaAnimacoes ordem={secoes.length + 3} registrarItem={registrarItem(secoes.length + 2)} />
        </div>
      </motion.div>
    </motion.nav>
  )
}

/* Linha fina entre os grupos. Fechada, cabe dentro da pílula (44px);
   aberta, atravessa o painel — o comprimento vem da --abertura (CSS). */
function Divisor() {
  return <span aria-hidden="true" className="trilho-divisor my-0.5 h-px bg-(--vf-divisor)" />
}

// Realce do item ativo: uma bolha de vidro em volta do ícone que VOA entre
// os itens (layoutId — o mesmo em todos, então a Motion anima de um pro outro).
function Realce() {
  return (
    <motion.span
      layoutId="rail-ativo"
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      className="absolute inset-y-0 right-0 w-11 rounded-full bg-(--vf-ativo) shadow-[inset_0_1px_0_var(--vf-ativo-brilho)]"
    />
  )
}

/* O interruptor "Animações": [barra] [rótulo estado] ........ [chavinha]
   Mesma anatomia da Linha (surge com a abertura, acende com o mouse em
   cima), só que é um botão role="switch", não um link. Ligado = animações
   normais; desligado = modo leve (ver ModoLeveContext.jsx). */
function LinhaAnimacoes({ ordem, registrarItem }) {
  const { leve, alternar } = useModoLeve()

  return (
    <button
      ref={registrarItem}
      type="button"
      role="switch"
      aria-checked={!leve}
      aria-label="Animações"
      onClick={alternar}
      className="group relative flex w-full items-center rounded-full"
    >
      <span
        aria-hidden="true"
        className="trilho-revela relative flex min-w-0 flex-1 items-center self-stretch"
        style={{ '--i': ordem }}
      >
        <span className="trilho-marca" />
        <span className="trilho-rotulo flex items-baseline text-[0.95rem] font-medium whitespace-nowrap">
          <span className="trilho-indice" />
          Animações
          <span className="ml-2 text-xs opacity-60">{leve ? 'desligadas' : 'ligadas'}</span>
        </span>
      </span>

      <span className="relative grid h-8 w-11 shrink-0 place-items-center">
        <Interruptor ligado={!leve} />
      </span>
    </button>
  )
}

/* Um item da lista: [barra] [número rótulo] ........ [ícone]
   Barra, número e rótulo reagem à --efeito que o useProximidade escreve no
   próprio link (mouse em cima); o tracinho, à --perto que ele escreve no
   próprio tracinho (mouse perto). Número e rótulo moram juntos e deslizam
   juntos, como no original; a barra fica ancorada e só cresce. O texto
   visível é aria-hidden porque o link já tem aria-label com o mesmo nome —
   o leitor de tela não precisa ouvir duas vezes. */
function Linha({
  ordem,
  registrarItem,
  registrarTique,
  para,
  externo = false,
  rotulo,
  rotuloAcessivel = rotulo,
  indice = '',
  Icone,
  ativo = false,
  seta = false,
  tique = false,
}) {
  const classes = 'group relative flex w-full items-center rounded-full'

  const conteudo = (
    <>
      <span
        aria-hidden="true"
        className="trilho-revela relative flex min-w-0 flex-1 items-center self-stretch"
        style={{ '--i': ordem }}
      >
        <span className="trilho-marca" />
        <span className="trilho-rotulo flex items-baseline text-[1.1rem] font-medium whitespace-nowrap">
          {/* o número ocupa espaço mesmo vazio: os rótulos ficam alinhados */}
          <span className="trilho-indice">{indice}</span>
          {rotulo}
          {seta && <ArrowUpRight size={15} strokeWidth={2.2} className="ml-1 self-center" />}
        </span>
        {tique && <span ref={registrarTique} className="trilho-tique" />}
      </span>

      {ativo && <Realce />}
      <span
        className={`relative grid size-11 shrink-0 place-items-center rounded-full transition-colors ${
          ativo
            ? 'text-(--vf-ativo-icone)'
            : 'text-texto-suave group-hover:bg-(--vf-hover) group-hover:text-texto'
        }`}
      >
        <Icone size={20} strokeWidth={2.2} />
      </span>
    </>
  )

  if (externo) {
    return (
      <a
        ref={registrarItem}
        href={para}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={rotuloAcessivel}
        className={classes}
      >
        {conteudo}
      </a>
    )
  }

  return (
    <Link
      ref={registrarItem}
      to={para}
      aria-label={rotuloAcessivel}
      aria-current={ativo ? 'page' : undefined}
      className={classes}
    >
      {conteudo}
    </Link>
  )
}

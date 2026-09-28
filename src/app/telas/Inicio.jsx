import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
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
import IconeRamo from '@/components/IconeRamo'
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
        <p className="font-script text-[25px] leading-none text-acento">{saudacao()}</p>
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
        <div className="mt-3.5 grid h-[252px] grid-cols-2 grid-rows-2 gap-3">
          <Ladrilho
            id="hamburgueres"
            sobe
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
            sobe
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
          <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-botao">
            Montar <ArrowRight size={15} strokeWidth={2.6} />
          </span>
        </span>

        {/* a comida passa da borda de cima do cartão */}
        <motion.span
          aria-hidden="true"
          style={{ x: menos ? 0 : arte1 }}
          className="pointer-events-none absolute right-1 bottom-4 flex w-[50%] items-end"
        >
          <span className="relative z-0 -mr-6 mb-2 block h-[84px] -rotate-12">
            <Fritas className="block h-full w-auto overflow-visible drop-shadow-[0_8px_10px_rgb(0_0_0/0.25)]" />
          </span>
          <span className="animate-flutua relative z-10 block w-[74%] drop-shadow-[0_12px_14px_rgb(0_0_0/0.3)]">
            {lancheDoCombo && <MiniBurger camadas={lancheDoCombo.camadas} justo />}
          </span>
          <span className="relative z-20 -ml-5 block h-[66px] rotate-12">
            <Lata cor="#d9241c" className="block h-full w-auto overflow-visible drop-shadow-[0_8px_10px_rgb(0_0_0/0.25)]" />
          </span>
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
   de tema, enquanto o círculo do tema novo cresce pela tela. */
function Ladrilho({ id, nome, quantos, arte, sobe = false, className = '' }) {
  const navigate = useNavigate()

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/cardapio?cat=${id}`, { state: { topo: true } })}
      whileTap="apertado"
      variants={{ apertado: { scale: 0.97 } }}
      data-sobe={sobe || undefined}
      className={`ladrilho relative overflow-hidden rounded-3xl text-left ${TOM[id]} ${className}`}
    >
      <span className="ladrilho-texto absolute inset-x-4 z-10 block">
        {/* Condensada (font-stretch 76%) e encolhendo com a tela até 15,5px:
            "Acompanhamentos" inteiro cabe num ladrilho de meia tela até em
            celular de 360px. Menor que isso, quebra no hífen marcado no nome
            (ver o ladrilho de Acompanhamentos), em vez de ser cortado. */}
        <span className="titulo-app block text-[clamp(15.5px,4.8vw,18px)] leading-[1.02] text-texto [font-stretch:76%]">
          {nome}
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
      className="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-texto/75"
    >
      <IconeRamo
        size={RAMO}
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

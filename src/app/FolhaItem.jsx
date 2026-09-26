import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { Minus, X } from 'lucide-react'
import { ADICIONAIS, camadasDoPedido, formatarPreco } from '@/data/cardapio'
import { useCarrinho } from '@/context/CarrinhoContext'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'
import MiniBurger from '@/components/burger/MiniBurger'
import Camada from '@/components/burger/Camada'
import { FOLGA_ABERTO, empilhar } from '@/components/burger/geometria'
import Ilustracao, { escalaDe } from '@/components/Ilustracao'
import SeletorQuantidade from '@/components/SeletorQuantidade'
import Preco from '@/components/Preco'
import { useVoo } from '@/app/voo'
import { useItemAberto } from '@/app/useItemAberto'
import { TOM } from '@/app/abas'

/* ============================================================================
   FOLHA DO PRODUTO — o "detalhe do item" do app
   ----------------------------------------------------------------------------
   Sobe de baixo por cima de qualquer aba (o produto aberto mora na URL,
   ver useItemAberto). Em cima, a vitrine na cor da categoria com o desenho
   GRANDE; embaixo, nome, preço, adicionais e a barra de adicionar.

   FECHAR: o X, o véu, a tecla Esc, o voltar do celular — ou ARRASTAR a
   folha pra baixo pela vitrine. O arrasto só começa na vitrine
   (dragListener={false} + dragControls): no resto da folha o dedo rola o
   conteúdo, e os dois gestos não brigam.

   O BURGER CRESCE AO VIVO: +1 bacon ali embaixo e uma tira de bacon cai no
   desenho lá em cima (o MiniBurger anima camada nova sozinho). O burger
   abre (camadas afastadas) logo depois que a folha chega — é a hero da
   landing, em miniatura. Mais camadas = burger mais alto; a largura se
   ajusta pra ele continuar cabendo inteiro na vitrine.

   Adicionar: o item entra na sacola, a folha desce e o desenho — já com os
   extras — voa até a Sacola da barra de baixo (voo.jsx).
   ========================================================================== */
export default function FolhaItem() {
  const { item, fechar } = useItemAberto()

  return (
    <AnimatePresence>
      {/* key: trocar de produto monta uma folha nova (adicionais zerados) */}
      {item && <Folha key={item.id} item={item} aoFechar={fechar} />}
    </AnimatePresence>
  )
}

// altura da vitrine: 40% da tela, entre 240 e 340px
const ALTURA_VITRINE = 'max(240px, min(40dvh, 340px))'

function Folha({ item, aoFechar }) {
  const [adicionais, setAdicionais] = useState({})
  const [quantidade, setQuantidade] = useState(1)
  const [aberto, setAberto] = useState(false)
  const arrasto = useDragControls()
  const fecharRef = useRef(null)
  const tituloId = useId()
  const menos = useMenosMovimento()
  const { adicionar } = useCarrinho()
  const { voar } = useVoo()

  const aceitaAdicionais = item.adicionais !== false
  const camadas = camadasDoPedido(item, adicionais)
  const extras = Object.entries(adicionais).reduce((soma, [id, qtd]) => {
    const adicional = ADICIONAIS.find((a) => a.id === id)
    return adicional ? soma + adicional.preco * qtd : soma
  }, 0)
  const total = (item.preco + extras) * quantidade

  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus({ preventScroll: true })

    const aoTeclar = (e) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', aoTeclar)

    // o burger abre quando a folha termina de subir
    const abrir = setTimeout(() => setAberto(true), menos ? 0 : 360)

    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
      clearTimeout(abrir)
    }
  }, [aoFechar, menos])

  const mudarAdicional = (adicional, delta) =>
    setAdicionais((atual) => {
      const novo = Math.min(adicional.max, Math.max(0, (atual[adicional.id] ?? 0) + delta))
      // voltou a zero: tira a chave em vez de deixar `bacon: 0` — é o que
      // faz "sem bacon" e "bacon zerado" virarem a MESMA linha na sacola
      if (!novo) {
        const { [adicional.id]: _removido, ...resto } = atual
        return resto
      }
      return { ...atual, [adicional.id]: novo }
    })

  const confirmar = (e) => {
    adicionar(item, adicionais, quantidade)
    voar(e.currentTarget, camadas ? { camadas } : { item })
    aoFechar()
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div
        aria-hidden="true"
        onClick={aoFechar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-(--veu) backdrop-blur-[3px]"
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        drag="y"
        dragControls={arrasto}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 650) aoFechar()
        }}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100dvh-16px)] max-w-[520px] flex-col
                   overflow-hidden rounded-t-[32px] bg-fundo shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.35)]"
      >
        {/* ---- VITRINE (e alça de arrastar) ---- */}
        <div
          onPointerDown={(e) => arrasto.start(e)}
          className={`relative shrink-0 touch-none overflow-hidden ${TOM[item.categoria]}`}
          style={{ height: ALTURA_VITRINE }}
        >
          <span aria-hidden="true" className="absolute top-2.5 left-1/2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-texto/20" />

          {/* luz de cima, como a vitrine do cardápio do site */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_65%,var(--luz-vitrine),transparent)]"
          />

          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
            {etiquetasDe(item).map((etiqueta) => (
              <span
                key={etiqueta}
                className="rounded-full bg-cartao/85 px-3 py-1.5 text-[12px] font-semibold text-texto backdrop-blur"
              >
                {etiqueta}
              </span>
            ))}
          </div>

          <button
            ref={fecharRef}
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="absolute top-3.5 right-3.5 grid size-10 place-items-center rounded-full bg-cartao/85 text-texto
                       backdrop-blur transition active:scale-90"
          >
            <X size={19} strokeWidth={2.4} />
          </button>

          <div aria-hidden="true" className="absolute inset-x-0 top-12 bottom-5 flex items-end justify-center">
            <span className="absolute bottom-0 left-1/2 h-4 w-[46%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,var(--sombra-burger),transparent)]" />
            {camadas ? (
              <BurgerDaVitrine camadas={camadas} aberto={aberto} />
            ) : (
              <motion.span
                className="relative flex items-end"
                style={{ height: `${escalaDe(item.id) * 0.9}%` }}
                initial={menos ? false : { y: 26, scale: 0.86, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.14 }}
              >
                <Ilustracao itemId={item.id} className="block h-full w-auto overflow-visible" />
              </motion.span>
            )}
          </div>
        </div>

        {/* ---- CONTEÚDO (rola por dentro) ---- */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={tituloId} className="titulo-app text-[30px] text-texto">
              {item.nome}
            </h2>
            <p className="titulo-app shrink-0 pt-1 text-[22px] text-texto tabular-nums">
              {formatarPreco(item.preco)}
            </p>
          </div>
          <p className="mt-2.5 max-w-[46ch] text-[14px] leading-relaxed text-texto-suave">{item.descricao}</p>

          {item.maior18 && (
            <p className="mt-4 rounded-2xl bg-cartao px-4 py-3 text-[12.5px] text-texto-suave">
              Venda proibida para menores de 18 anos. A idade é conferida na entrega.
            </p>
          )}

          {aceitaAdicionais && (
            <section className="mt-7" aria-labelledby={`${tituloId}-extras`}>
              <div className="flex items-baseline gap-2">
                <h3 id={`${tituloId}-extras`} className="titulo-app text-[21px] text-texto">
                  Adicionais
                </h3>
                <span className="font-script text-[19px] leading-none text-acento">turbine do seu jeito</span>
              </div>

              <ul className="mt-3.5 grid grid-cols-3 gap-2.5">
                {ADICIONAIS.map((adicional) => (
                  <Adicional
                    key={adicional.id}
                    adicional={adicional}
                    qtd={adicionais[adicional.id] ?? 0}
                    aoMais={() => mudarAdicional(adicional, 1)}
                    aoMenos={() => mudarAdicional(adicional, -1)}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ---- BARRA DE ADICIONAR ---- */}
        <footer className="border-t border-linha bg-fundo px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <SeletorQuantidade valor={quantidade} onMudar={setQuantidade} min={1} max={20} rotulo="quantidade" />
            <motion.button
              type="button"
              onClick={confirmar}
              whileTap={{ scale: 0.97 }}
              className="flex h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl bg-botao px-5
                         text-white shadow-(--sombra-botao)"
            >
              <span className="font-display text-[16px] font-bold">Adicionar</span>
              <Preco valor={total} className="font-display text-[17px] font-bold tabular-nums" />
            </motion.button>
          </div>
        </footer>
      </motion.section>
    </div>
  )
}

/* O burger da vitrine, ABERTO. A largura sai da altura: o burger aberto
   é `alturaAberta`% da própria largura de alto, e tem que caber na
   vitrine (menos a folga de cima e de baixo). Com mais adicionais ele fica
   mais alto — e mais estreito, deslizando (transition na largura). */
function BurgerDaVitrine({ camadas, aberto }) {
  const alturaAberta = empilhar(['topo', ...camadas, 'base'], FOLGA_ABERTO).altura
  const largura = `min(58%, calc((${ALTURA_VITRINE} - 76px) * ${(100 / alturaAberta).toFixed(4)}))`

  return (
    <span className="relative block transition-[width] duration-500 ease-(--ease-mordida)" style={{ width: largura }}>
      <MiniBurger camadas={camadas} aberto={aberto} />
    </span>
  )
}

/* ---- UM ADICIONAL ----
   Tocar no ladrilho põe +1 (até o máximo). Escolhido, ele ganha o aro
   vermelho, a contagem no canto e um "−" pra tirar. */
function Adicional({ adicional, qtd, aoMais, aoMenos }) {
  const nome = nomeCurto(adicional.nome)
  const cheio = qtd >= adicional.max

  return (
    <li className="relative">
      <button
        type="button"
        onClick={aoMais}
        aria-disabled={cheio}
        aria-label={
          cheio
            ? `${nome}: já está no máximo (${adicional.max})`
            : `Adicionar ${nome}, mais ${formatarPreco(adicional.preco)}${qtd ? `. ${qtd} escolhido${qtd > 1 ? 's' : ''}` : ''}`
        }
        className={`flex w-full flex-col items-center rounded-2xl bg-cartao px-1.5 pt-3 pb-2.5 text-center
                    shadow-(--sombra-cartao) ring-2 transition-[box-shadow,scale] duration-200 active:scale-95
                    ${qtd ? 'ring-acento' : 'ring-transparent'}`}
      >
        <Amostra tipo={adicional.camada} />
        <span className="mt-2 text-[12.5px] leading-tight font-semibold text-texto">{nome}</span>
        <span className="mt-0.5 text-[11.5px] text-texto-suave tabular-nums">+ {formatarPreco(adicional.preco)}</span>
      </button>

      <AnimatePresence>
        {qtd > 0 && (
          <motion.span
            key="contagem"
            aria-hidden="true"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 26 }}
            className="absolute -top-2 -right-1.5 grid size-6 place-items-center overflow-hidden rounded-full bg-botao
                       text-[12px] font-bold text-white ring-2 ring-fundo tabular-nums"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={qtd}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                {qtd}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
        {qtd > 0 && (
          <motion.button
            key="menos"
            type="button"
            onClick={aoMenos}
            aria-label={`Tirar um ${nome}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 26 }}
            // o círculo é pequeno (24px), mas o toque vale num quadrado de
            // 44px em volta dele (o ::before transparente)
            className="absolute -top-2 -left-1.5 grid size-6 place-items-center rounded-full bg-cartao text-texto
                       shadow-(--sombra-cartao) ring-2 ring-fundo before:absolute before:-inset-2.5 before:content-['']"
          >
            <Minus size={13} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </li>
  )
}

/* A amostra do ingrediente: uma PILHA dele (três fatias de bacon, duas
   carnes…), recortada pelo círculo. A camada do burger é uma tira fina —
   sozinha, num ladrilho, viraria um risco de 4px. Empilhada e desenhada
   2,2× mais larga que o círculo, ela vira "um montinho de bacon": o
   círculo mostra só o miolo, com a textura (o bacon ondulado, o cheddar
   escorrendo, as rodelas de calabresa). Cada fatia um tico deslocada pro
   lado, pra não parecer carimbo. */
const FATIAS = { carne: 2 }

function Amostra({ tipo }) {
  const fatias = FATIAS[tipo] ?? 3

  return (
    <span aria-hidden="true" className="relative grid size-14 place-items-center overflow-hidden rounded-full bg-cartao-2">
      <span className="flex w-[220%] shrink-0 flex-col items-center gap-[3px]">
        {Array.from({ length: fatias }, (_, i) => (
          <span key={i} className="block w-full" style={{ translate: `${i % 2 ? 5 : -5}px 0` }}>
            <Camada tipo={tipo} />
          </span>
        ))}
      </span>
    </span>
  )
}

// "Queijo cheddar fatiado" → "Cheddar": num ladrilho de 100px, o nome
// inteiro quebraria em três linhas
function nomeCurto(nome) {
  const curto = nome.replace(/^Queijo /, '').replace(/ fatiado$/, '')
  return curto[0].toUpperCase() + curto.slice(1)
}

/* As etiquetas da vitrine. Só o que dá pra afirmar lendo o cardápio: o
   nome diz se é artesanal; a categoria das bebidas é "geladas" no próprio
   cardápio da loja. Nada de "mais vendido" — a loja é nova e não há dado. */
function etiquetasDe(item) {
  const etiquetas = []
  if (item.categoria === 'hamburgueres') {
    etiquetas.push(item.id.includes('artesanal') ? 'Artesanal' : 'Clássico')
  }
  if (item.categoria === 'bebidas') etiquetas.push('Gelada')
  if (item.maior18) etiquetas.push('+18')
  return etiquetas
}

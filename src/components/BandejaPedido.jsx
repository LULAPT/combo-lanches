import { AnimatePresence, motion } from 'motion/react'
import { useCardapio } from '@/hooks/useCardapio'
import CenaBandeja from '@/components/CenaBandeja'
import Ilustracao, { escalaDe } from '@/components/Ilustracao'
import { alturaFechada } from '@/components/burger/geometria'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   BANDEJA DO PEDIDO — o topo do carrinho
   ----------------------------------------------------------------------------
   A mesma bandeja do Monte seu Combo (CenaBandeja), só que com o pedido
   INTEIRO em cima: os lanches com os extras que o cliente escolheu, as
   batatas, as bebidas. Abrir o carrinho é ver a comida pousando ali, uma
   peça depois da outra — o "deu certo" visual do pedido, antes da lista.

   É decoração: a informação de verdade (nome, extras, quantidade, preço)
   está na lista logo abaixo, e é ela que o leitor de tela lê. Por isso a
   bandeja inteira é aria-hidden.

   ARRUMAÇÃO: lanches, depois acompanhamentos, depois bebidas — a mesma
   ordem da bandeja do combo (lanche à esquerda, lata à direita). Cada linha
   do carrinho vira UMA peça; quantidade maior que 1 ganha um "×2" escrito à
   mão em cima, em vez de desenhar duas latas iguais.

   MUITA COISA: a partir de 4 peças tudo encolhe um pouco pra caber; passou
   de MAX_PECAS, as que sobram viram um "+3" manuscrito no fim da fila.
   ========================================================================== */

const MAX_PECAS = 6
const ORDEM = { hamburgueres: 0, acompanhamentos: 1, bebidas: 2 }

// quanto cada peça encolhe conforme a bandeja enche (índice = nº de peças)
const ENCOLHE = [1, 1, 1, 1, 0.9, 0.8, 0.72]

/* Largura do lanche, em % da fileira. O limite de 2600/altura segura os
   burgers ALTOS (muitas camadas): quanto mais alto por largura, mais
   estreito, e todos acabam com a mesma altura máxima na bandeja. */
const larguraDoLanche = (camadas) => Math.min(32, 2600 / alturaFechada(camadas))

// a queda: a mesma do Monte seu Combo, com a peça caindo de mais alto
const QUEDA = {
  initial: { y: -70, opacity: 0, rotate: -10, scale: 0.9 },
  exit: { y: 24, opacity: 0, scale: 0.85, transition: { duration: 0.2 } },
  transition: { type: 'spring', stiffness: 260, damping: 20 },
}

export default function BandejaPedido({ linhas }) {
  const { itens } = useCardapio()
  const reduzido = useMenosMovimento()

  const categoria = (itemId) => itens.find((i) => i.id === itemId)?.categoria
  const ordenadas = [...linhas].sort(
    (a, b) => (ORDEM[categoria(a.itemId)] ?? 1) - (ORDEM[categoria(b.itemId)] ?? 1),
  )
  const visiveis = ordenadas.slice(0, MAX_PECAS)
  const sobram = ordenadas.length - visiveis.length
  const escala = ENCOLHE[visiveis.length] ?? ENCOLHE.at(-1)

  return (
    <CenaBandeja
      rotulo={linhas.length ? null : 'vazia, por enquanto'}
      // mais baixa que a do combo: aqui ela divide a altura com a lista
      className="aspect-[9/4]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-[5%] top-[14%] bottom-[15%] flex items-end justify-center"
      >
        <AnimatePresence mode="popLayout">
          {visiveis.map((linha, i) => (
            <motion.span
              key={linha.linhaId}
              layout
              initial={reduzido ? false : QUEDA.initial}
              // o atraso só vale pra queda (cada peça um tico depois da
              // anterior, esperando a gaveta terminar de abrir); o `layout`
              // — as peças se arrumando quando uma sai — não espera
              animate={{
                y: 0,
                opacity: 1,
                rotate: 0,
                scale: 1,
                transition: { ...QUEDA.transition, delay: reduzido ? 0 : 0.18 + i * 0.07 },
              }}
              exit={QUEDA.exit}
              transition={QUEDA.transition}
              className="relative flex shrink-0 items-end"
              style={{
                marginLeft: i === 0 ? 0 : '-2.5%',
                // lanche: largura; o resto: altura (a lata é baixinha, a
                // garrafa de 2L é alta — a mesma escala da vitrine do cardápio)
                ...(linha.camadas
                  ? { width: `${larguraDoLanche(linha.camadas) * escala}%` }
                  : { height: `${escalaDe(linha.itemId) * escala}%` }),
                zIndex: i,
              }}
            >
              {linha.camadas ? (
                <span className="block w-full">
                  <Ilustracao camadas={linha.camadas} justo />
                </span>
              ) : (
                <Ilustracao itemId={linha.itemId} className="block h-full w-auto overflow-visible" />
              )}

              {/* centralizado em cima da peça: no canto, o "×2" do lanche
                  encostava na batata ao lado e parecia ser dela */}
              {linha.quantidade > 1 && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-script text-xl leading-none text-acento tabular-nums">
                  ×{linha.quantidade}
                </span>
              )}
            </motion.span>
          ))}

          {sobram > 0 && (
            <motion.span
              key="sobram"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-[6%] ml-2 shrink-0 self-center font-script text-2xl text-texto-suave"
            >
              +{sobram}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </CenaBandeja>
  )
}

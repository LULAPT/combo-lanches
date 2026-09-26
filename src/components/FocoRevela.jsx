import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import PalavraTracada from '@/components/PalavraTracada'

/* ============================================================================
   FOCO REVELA — o TrueFocus do ReactBits, adaptado pra uma revelação só
   ----------------------------------------------------------------------------
   Visual igual ao TrueFocus (reactbits.dev): palavras borradas, uma moldura
   de quatro cantos com brilho deslizando de palavra em palavra, e a palavra
   dentro da moldura ficando nítida.

   POR QUE NÃO O COMPONENTE ORIGINAL
   O TrueFocus roda em LOOP infinito e volta a borrar as palavras que ficaram
   pra trás — e o índice é estado interno dele, não dá pra controlar de
   fora. O pedido aqui era outro: começa tudo borrado, a moldura passa uma
   vez revelando cada palavra (que fica nítida pra sempre) e PARA na última.
   Isso não sai de nenhuma combinação de props do original, então virou um
   componente nosso, com a mesma cara.

   Diferenças pro original, além do comportamento:
   - Classes do Tailwind no lugar do TrueFocus.css.
   - Recebe `palavras` (com classe própria e quebra de linha opcional) em vez
     de uma frase — o "verdade." precisa do degradê da marca e de uma linha
     só dele.
   - Remede a moldura quando o título muda de tamanho (tela girando, fonte
     carregando atrasada). O original só media na troca de palavra, e a
     moldura ficaria torta em volta do "VERDADE." depois de um resize.

   SINAL PERDIDO: quando a moldura trava na última palavra, ela dá uma
   piscada irregular com um tremidinho — como mira de câmera perdendo e
   recuperando o sinal — e aí fica parada. Os tempos da piscada são
   desiguais DE PROPÓSITO: piscar em ritmo regular parece "carregando";
   irregular parece falha de sinal.

   PALAVRA TRAÇADA: uma palavra com `tracado: true` não usa o desfoque —
   ela começa invisível e, quando a moldura chega nela, SE DESENHA (ver
   PalavraTracada.jsx: contorno letra por letra, depois o preenchimento).
   Se for a última, o onFim espera o desenho terminar.

   `pular`: mostra direto o estado final (tudo nítido, moldura na última
   palavra). A hero usa isso da segunda visita em diante e pra quem pediu
   menos movimento no sistema.
   ========================================================================== */
export default function FocoRevela({
  palavras,
  pular = false,
  atraso = 0.35,
  passo = 0.4,
  pausa = 0.16,
  desfoque = 9,
  folgaTopo = 0.14,
  onFim,
  className = '',
  as: Tag = 'h1',
}) {
  const total = palavras.length
  const [indice, setIndice] = useState(pular ? total - 1 : -1)
  const [caixa, setCaixa] = useState(null)
  const [piscando, setPiscando] = useState(false)
  const tituloRef = useRef(null)
  const palavrasRef = useRef([])

  /* A SEQUÊNCIA: um setTimeout por palavra, todos agendados de uma vez.
     A limpeza cancela todos — sem ela, o StrictMode (que monta duas vezes
     no dev) deixaria timers duplicados pulando índice. */
  useEffect(() => {
    if (pular) {
      onFim?.()
      return
    }

    const timers = palavras.map((_, i) =>
      setTimeout(() => setIndice(i), (atraso + i * (passo + pausa)) * 1000),
    )
    // se a última palavra é traçada, quem avisa o fim é ela (onDesenhada),
    // quando terminar de se desenhar — não dá pra saber isso por relógio aqui
    if (!palavras[total - 1].tracado) {
      timers.push(
        setTimeout(() => onFim?.(), (atraso + (total - 1) * (passo + pausa) + passo) * 1000),
      )
    }

    return () => timers.forEach(clearTimeout)
    // roda UMA vez, na montagem — é uma intro, não reage a mudança de props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Chegou na última palavra: espera a moldura terminar de deslizar
     (`passo`) e pisca. Na volta pro site (pular), não pisca. */
  useEffect(() => {
    if (pular || indice !== total - 1) return
    const id = setTimeout(() => setPiscando(true), passo * 1000)
    return () => clearTimeout(id)
  }, [indice, pular, total, passo])

  /* MEDIÇÃO: posição e tamanho da palavra ativa, relativos ao título.
     useLayoutEffect (e não useEffect) pra medir antes da pintura — senão
     a moldura apareceria um frame no lugar velho. */
  useLayoutEffect(() => {
    const titulo = tituloRef.current
    if (indice < 0 || !titulo) return

    const medir = () => {
      const alvo = palavrasRef.current[indice]
      if (!alvo) return
      const a = alvo.getBoundingClientRect()
      const t = titulo.getBoundingClientRect()
      // folgaTopo: a caixa de uma palavra inclui o vão que a fonte reserva
      // ACIMA das maiúsculas (pros acentos). Com leading apertado, esse vão
      // fica todo em cima e a moldura parecia subir até a linha de cima.
      // Desconta essa fração da altura, só no topo.
      const folga = a.height * folgaTopo
      setCaixa({
        x: a.left - t.left,
        y: a.top - t.top + folga,
        largura: a.width,
        altura: a.height - folga,
      })
    }

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(titulo)
    // a fonte do título (Oswald) pode chegar depois da primeira medida e
    // mudar a largura das palavras sem mudar o tamanho do título
    document.fonts?.ready.then(medir)

    return () => observador.disconnect()
  }, [indice])

  return (
    <Tag ref={tituloRef} className={`relative ${className}`}>
      {palavras.map((palavra, i) => {
        const nitida = i <= indice
        const separador = palavra.quebra ? <br /> : i < total - 1 ? ' ' : null

        if (palavra.tracado) {
          return (
            <Fragment key={i}>
              <PalavraTracada
                texto={palavra.texto}
                cor={palavra.cor}
                ativa={nitida}
                pular={pular}
                refRaiz={(el) => {
                  palavrasRef.current[i] = el
                }}
                onDesenhada={i === total - 1 ? onFim : undefined}
              />
              {separador}
            </Fragment>
          )
        }

        return (
          <Fragment key={i}>
            <span
              ref={(el) => {
                palavrasRef.current[i] = el
              }}
              className={`inline-block transition-[filter,opacity] ease-out ${palavra.className ?? ''}`}
              style={{
                filter: nitida ? 'blur(0px)' : `blur(${desfoque}px)`,
                opacity: nitida ? 1 : 0.5,
                transitionDuration: `${passo}s`,
              }}
            >
              {palavra.texto}
            </span>
            {separador}
          </Fragment>
        )
      })}

      {/* A MOLDURA. Nasce na primeira palavra "travando a mira": começa 30%
          maior e transparente e encolhe até encaixar. Depois só desliza. */}
      {caixa && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          initial={
            pular
              ? false
              : { x: caixa.x, y: caixa.y, width: caixa.largura, height: caixa.altura, opacity: 0, scale: 1.3 }
          }
          animate={{
            x: caixa.x,
            y: caixa.y,
            width: caixa.largura,
            height: caixa.altura,
            opacity: 1,
            scale: 1,
          }}
          transition={{ duration: passo, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* A piscada mora numa camada POR DENTRO da moldura. Se fosse na
              própria moldura, os quadros-chave de opacidade e x brigariam
              com a animação que posiciona a moldura na palavra. */}
          <motion.span
            className="absolute inset-0"
            animate={
              piscando
                ? {
                    opacity: [1, 0.15, 1, 0.05, 0.85, 0.1, 1, 0.55, 1],
                    x: [0, -3, 2, 0, 3, -1, 0, 1, 0],
                    scale: [1, 1.05, 1, 1, 1.03, 1, 1, 1.01, 1],
                  }
                : { opacity: 1, x: 0, scale: 1 }
            }
            transition={{
              duration: 0.75,
              // intervalos desiguais = falha de sinal, não "carregando"
              times: [0, 0.08, 0.16, 0.3, 0.38, 0.55, 0.62, 0.85, 1],
              ease: 'linear',
            }}
          >
            <Canto className="-top-2.5 -left-2.5 border-r-0 border-b-0" />
            <Canto className="-top-2.5 -right-2.5 border-b-0 border-l-0" />
            <Canto className="-bottom-2.5 -left-2.5 border-t-0 border-r-0" />
            <Canto className="-right-2.5 -bottom-2.5 border-t-0 border-l-0" />
          </motion.span>
        </motion.span>
      )}
    </Tag>
  )
}

/* Um canto da moldura: um quadradinho com só duas bordas (o resto some pela
   classe de cada posição). Cor do TEXTO, sem brilho: a moldura é neutra
   pra que o único ponto de cor do título seja a palavra dentro dela. (Já
   foi amarelo com brilho neon — dois acentos brigando, e as skills de
   design proíbem brilho externo.) */
function Canto({ className }) {
  return (
    <span
      className={`absolute size-4 rounded-[3px] border-[3px] border-texto ${className}`}
    />
  )
}

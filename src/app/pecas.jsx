import { motion, useScroll, useTransform } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   PEÇAS DAS TELAS DO APP
   ----------------------------------------------------------------------------
     TituloRevelado    as palavras do título sobem por trás de uma máscara —
                       o mesmo gesto dos títulos de seção do site
     CabecalhoTela     nota manuscrita + título grande; ao rolar, uma barra
                       fina com o título aparece presa no topo (o "título
                       grande que vira pequeno" dos apps de celular)
     TituloSecao       nota manuscrita + título de seção + ação opcional

   A NOTA MANUSCRITA (Caveat, vermelha) vem SEMPRE em cima do título. É a
   assinatura da marca que veio do site ("é o nome da casa, né?").

   (A entrada em cascata das telas — cascata/subir — mora no animacoes.js.)
   ========================================================================== */

/* Cada palavra num "vão" com overflow escondido e sobe de 105% até o
   lugar. O vão ganha um respiro em cima e embaixo (py + -my, que se
   anulam no layout): sem isso, o acento do "á" e a perna do "p" e do "ç"
   seriam cortados — o título usa entrelinha 0,95.
   O leitor de tela lê o aria-label (a frase inteira), não as palavras
   soltas. */
export function TituloRevelado({ texto, as: Tag = 'h1', className = '', atraso = 0.06 }) {
  const menos = useMenosMovimento()
  const palavras = texto.split(' ')

  return (
    <Tag className={className} aria-label={texto}>
      {palavras.map((palavra, i) => (
        <span key={i} aria-hidden="true">
          <span className="-my-[0.16em] inline-block overflow-hidden py-[0.16em] align-bottom">
            <motion.span
              className="inline-block"
              initial={menos ? false : { y: '108%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: atraso + i * 0.07 }}
            >
              {palavra}
            </motion.span>
          </span>
          {i < palavras.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}

/* Barra fina do topo: aparece entre 56 e 104px de rolagem, quando o
   título grande já saiu da tela. É só visual (aria-hidden) — o título de
   verdade é o h1 lá embaixo. `position: fixed` dentro de uma aba
   escondida (display: none) também some: cada aba tem a sua. */
export function CabecalhoTela({ nota, titulo, acao, barra = true }) {
  const menos = useMenosMovimento()
  const { scrollY } = useScroll()
  const opacidade = useTransform(scrollY, [56, 104], [0, 1])
  const deslize = useTransform(scrollY, [56, 104], [-6, 0])

  return (
    <>
      {barra && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: opacidade }}
          className="pointer-events-none fixed inset-x-0 top-0 z-30 border-b border-linha/70 bg-fundo/85
                     pt-[max(env(safe-area-inset-top),10px)] pb-3 text-center backdrop-blur-xl"
        >
          <motion.span style={{ y: menos ? 0 : deslize }} className="titulo-app inline-block text-[17px] text-texto">
            {titulo}
          </motion.span>
        </motion.div>
      )}

      <header className="flex items-end justify-between gap-4 px-5 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="min-w-0">
          {nota && (
            <motion.p
              initial={menos ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.02 }}
              className="font-script text-[24px] leading-none text-acento"
            >
              {nota}
            </motion.p>
          )}
          <TituloRevelado texto={titulo} className="titulo-app mt-1.5 text-[42px] text-texto" />
        </div>
        {acao && <div className="shrink-0 pb-1.5">{acao}</div>}
      </header>
    </>
  )
}

export function TituloSecao({ nota, titulo, acao, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {nota && <p className="font-script text-[19px] leading-none text-acento">{nota}</p>}
        <h2 className="titulo-app mt-1 text-[24px] text-texto">{titulo}</h2>
      </div>
      {acao && <div className="shrink-0 pb-0.5">{acao}</div>}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   TÍTULO DE SEÇÃO
   ----------------------------------------------------------------------------
   O "Menu ———— full menu" da referência: título grande, uma linha fina que
   corre até a borda e uma nota escrita à mão na ponta dela.

   Composições diferentes por tamanho:
   celular  → nota manuscrita EM CIMA, título, e a linha embaixo sozinha
              (título + linha + nota lado a lado não cabem em 300px)
   desktop  → nota em cima, título + linha + link manuscrito na mesma linha

   A linha "corre" da esquerda pra direita quando a seção entra na tela.
   ========================================================================== */
export default function TituloSecao({ nota, titulo, link, linkPara }) {
  const reduzido = useMenosMovimento()

  return (
    <header>
      <motion.p
        initial={reduzido ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="font-script text-2xl text-acento md:text-3xl"
      >
        {nota}
      </motion.p>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <h2 className="overflow-hidden text-[clamp(2.8rem,13vw,4.5rem)] leading-[0.95] md:text-[clamp(4rem,8vw,7rem)]">
          <motion.span
            className="inline-block"
            initial={reduzido ? false : { y: '100%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {titulo}
          </motion.span>
        </h2>

        <div className="flex flex-1 items-center gap-4">
          <motion.span
            aria-hidden="true"
            className="h-px flex-1 origin-left bg-linha"
            initial={reduzido ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
          {link && (
            <Link
              to={linkPara}
              className="font-script text-2xl whitespace-nowrap text-texto-suave transition hover:text-acento"
            >
              {link} →
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

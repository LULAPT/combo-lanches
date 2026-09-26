import { createContext, useContext } from 'react'
import { motion } from 'motion/react'

/* ============================================================================
   REVELAR — o [data-reveal] do Lidera360/zoo, agora em React
   ----------------------------------------------------------------------------
   Porte fiel do seu sistema de scroll reveal. Os números são os mesmos:

     padrão   translateY(36px) → 0
     left     translateX(-48px) → 0
     right    translateX(48px) → 0
     scale    scale(.9) → 1
     fade     só opacidade
     easing   cubic-bezier(.16, 1, .3, 1)
     stagger  90ms entre irmãos

   O QUE MUDOU — e por que ficou mais fluido:

   No vanilla você tinha IntersectionObserver + classe .in-view + o stagger
   escrito como `transition-delay` inline em cada irmão. Três problemas que
   sumiram aqui:

   1. O delay por CSS é fixo no elemento. Se o usuário rolasse rápido, o
      último item do grupo ainda esperava 540ms parado na tela já visível.
      A Motion escalona a partir do momento em que o grupo entra, e como é
      orquestração real (não delay declarado), a sensação é contínua.

   2. `transition` do CSS não consegue ser interrompida no meio. Se o elemento
      saísse e voltasse, ele dava um pulo. A Motion interpola do valor ATUAL
      pro novo, então nunca há salto.

   3. O stagger vinha de `:nth-child` / índice escrito na mão. Aqui é
      `staggerChildren` no pai — adicionar um filho no meio não exige
      renumerar nada.

   COMO USAR

     <Revelar>bloco único</Revelar>
     <Revelar variante="left" atraso={0.2}>...</Revelar>

     <RevelarGrupo>
       <Revelar>item 1</Revelar>   ← estes entram em sequência,
       <Revelar>item 2</Revelar>      90ms um depois do outro
     </RevelarGrupo>

   Dentro de um grupo, o <Revelar> para de observar a rolagem sozinho e passa
   a obedecer o pai. É o que garante que o grupo entre junto em vez de cada
   item disparar no seu próprio momento.
   ========================================================================== */

const EASE = [0.16, 1, 0.3, 1]
const DURACAO = 0.8
const STAGGER = 0.09

const VARIANTES = {
  padrao: { y: 36 },
  cima: { y: -36 },
  left: { x: -48 },
  right: { x: 48 },
  scale: { scale: 0.9 },
  fade: {},
}

// Avisa os filhos que existe um pai orquestrando.
const GrupoContext = createContext(false)

export function RevelarGrupo({
  children,
  className = '',
  stagger = STAGGER,
  atraso = 0,
  margem = '-80px',
  as: Tag = 'div',
}) {
  const Componente = motion[Tag] ?? motion.div

  return (
    <GrupoContext value={true}>
      <Componente
        className={className}
        initial="oculto"
        whileInView="visivel"
        /* once: true = anima uma vez e pronto. Reanimar a cada rolagem
           incomoda quem sobe e desce a página procurando uma informação. */
        viewport={{ once: true, margin: margem }}
        variants={{
          oculto: {},
          visivel: {
            transition: { staggerChildren: stagger, delayChildren: atraso },
          },
        }}
      >
        {children}
      </Componente>
    </GrupoContext>
  )
}

export default function Revelar({
  children,
  variante = 'padrao',
  atraso = 0,
  duracao = DURACAO,
  className = '',
  margem = '-80px',
  as: Tag = 'div',
}) {
  const dentroDeGrupo = useContext(GrupoContext)
  const Componente = motion[Tag] ?? motion.div

  const deslocamento = VARIANTES[variante] ?? VARIANTES.padrao

  const variants = {
    oculto: { opacity: 0, ...deslocamento },
    visivel: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: duracao, ease: EASE, delay: atraso },
    },
  }

  // Dentro de um grupo: só declara as variantes e deixa o pai disparar.
  // Passar initial/whileInView aqui quebraria a orquestração — o filho
  // animaria por conta própria e o stagger seria ignorado.
  if (dentroDeGrupo) {
    return (
      <Componente className={className} variants={variants}>
        {children}
      </Componente>
    )
  }

  return (
    <Componente
      className={className}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: margem }}
      variants={variants}
    >
      {children}
    </Componente>
  )
}

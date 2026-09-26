import { Suspense, lazy } from 'react'
import { MotionConfig } from 'motion/react'
import { useCelular } from '@/hooks/useCelular'
import { useModoLeve } from '@/context/ModoLeveContext'
import Logo from '@/components/Logo'

/* ============================================================================
   APP — qual das duas experiências?
   ----------------------------------------------------------------------------
   O projeto tem duas caras, com o mesmo cardápio, a mesma sacola e a mesma
   marca por baixo:

     Site        desktop e tablet: a landing empilhada, o trilho de vidro,
                 o tema escuro por padrão (Site.jsx)
     AppCelular  celular: um app de verdade — abas embaixo, telas curtas,
                 tema claro por padrão (src/app/)

   Quem decide é o useCelular() (largura < 768px, ou celular deitado). Girar
   o aparelho ou redimensionar a janela troca uma pela outra na hora; a
   sacola e as preferências vivem nos contextos (main.jsx), por fora das
   duas, e não se perdem na troca.

   lazy(): cada experiência é um arquivo JavaScript separado. O celular
   nunca baixa o código da landing (hero, grade, árvore dos burgers), e o
   computador nunca baixa o do app. Enquanto o arquivo chega, a logo fica
   na tela (Abrindo).

   MODO LEVE: o MotionConfig liga o "menos movimento" da Motion em TODO
   componente animado de uma vez quando o visitante desliga as animações
   no interruptor. 'never' (desligado) é o padrão da própria Motion — com
   o interruptor ligado, nada muda em relação a antes. Vale pras duas
   experiências.
   ========================================================================== */
const Site = lazy(() => import('@/Site'))
const AppCelular = lazy(() => import('@/app/AppCelular'))

export default function App() {
  const celular = useCelular()
  const { leve } = useModoLeve()

  return (
    <MotionConfig reducedMotion={leve ? 'always' : 'never'}>
      <Suspense fallback={<Abrindo />}>{celular ? <AppCelular /> : <Site />}</Suspense>
    </MotionConfig>
  )
}

function Abrindo() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true">
      <Logo className="h-14 opacity-60" />
    </div>
  )
}

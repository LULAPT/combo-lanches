import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMotionValueEvent, useScroll } from 'motion/react'

/* ============================================================================
   useSecaoAtiva — qual seção da landing está na tela agora?
   ----------------------------------------------------------------------------
   Alimenta a bolinha de "ativo" da navegação: ela sai do Início e vai pra
   Burgers, Combo, Onde estamos, conforme você rola.

   POR QUE NÃO IntersectionObserver (o jeito "normal" de fazer isso)
   As seções da landing são sticky e se empilham. Uma seção que você já
   passou continua GRUDADA no topo, só que coberta pelas seguintes — e pro
   IntersectionObserver ela está 100% visível. Ele diria que Início, Burgers
   e Combo estão todas na tela ao mesmo tempo.

   Então a conta é feita pela posição de cada seção na pilha SEM o sticky
   (a mesma ideia do RolagemDeRota, no App.jsx): o topo da .pilha + a
   altura de cada irmã anterior. A seção ativa é a última cujo topo já
   passou de 45% da altura da tela — ou seja, a que já cobriu mais da
   metade da anterior.

   Só vale na landing; em outra rota devolve null.
   ========================================================================== */
const LINHA_DE_CORTE = 0.45

export function useSecaoAtiva() {
  const { pathname } = useLocation()
  const { scrollY } = useScroll()
  const [ativa, setAtiva] = useState(null)

  const calcular = (y) => {
    const pilha = pathname === '/' ? document.querySelector('.pilha') : null
    if (!pilha) {
      setAtiva(null)
      return
    }

    const limite = y + window.innerHeight * LINHA_DE_CORTE
    let topo = pilha.getBoundingClientRect().top + window.scrollY
    let atual = null

    // Só leituras (offsetHeight) e nenhuma escrita no DOM dentro do laço:
    // ler e escrever alternado forçaria o navegador a recalcular o layout a
    // cada volta. Assim, é uma conta só por evento de rolagem.
    for (const filha of pilha.children) {
      if (filha.id && topo <= limite) atual = filha.id
      topo += filha.offsetHeight
    }

    // setState com o mesmo valor não redesenha nada — o React compara e
    // desiste. Na prática, redesenha 3 ou 4 vezes na página inteira.
    setAtiva(atual)
  }

  useMotionValueEvent(scrollY, 'change', calcular)

  // Ao trocar de rota, calcula de cara — sem esperar a primeira rolagem.
  // O setTimeout dá um tick pra landing montar antes de medir.
  useEffect(() => {
    const id = setTimeout(() => calcular(window.scrollY), 50)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return ativa
}

/* ============================================================================
   TEMA — um para o SITE, outro para o APP
   ----------------------------------------------------------------------------
   São duas experiências (ver App.jsx) e cada uma guarda o PRÓPRIO tema:

     site  (desktop, tablet)  combo-lanches:tema      padrão ESCURO
     app   (celular)          combo-lanches:tema-app  padrão CLARO

   Separados de propósito: o site foi desenhado no escuro (é onde ele fica
   mais bonito) e o app foi desenhado no claro. Quem escolhe o claro no
   computador não leva o celular junto, e vice-versa.

   O tema em si é 100% CSS: atributos no <html> trocam os tokens (index.css).
     data-app            é o app (celular) — ativa a paleta própria dele
     data-tema="claro"   tema claro; sem o atributo, é o escuro
   O React só precisa saber o tema atual pra desenhar o ícone certo nos
   botões, pintar as fagulhas do clique e redesenhar a grade da hero.

   O script inline do index.html já aplicou tudo ANTES de o React existir
   (senão, flash do tema errado a cada F5). Aqui a gente só reaplica quando
   a experiência muda sem recarregar — celular girado, janela redimensionada
   por cima dos 768px.
   ========================================================================== */

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useCelular } from '@/hooks/useCelular'

const CHAVES = { site: 'combo-lanches:tema', app: 'combo-lanches:tema-app' }
const PADRAO = { site: 'escuro', app: 'claro' }

// cor da barra do navegador no celular, acompanhando o fundo de cada tema
const COR_BARRA = {
  site: { escuro: '#0a0a0b', claro: '#f6f6f7' },
  app: { escuro: '#121211', claro: '#f4f4f1' },
}

const TemaContext = createContext(null)

function lerSalvo(modo) {
  try {
    const salvo = localStorage.getItem(CHAVES[modo])
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // aba anônima: fica o padrão
  }
  return PADRAO[modo]
}

function aplicarNoDocumento(modo, tema) {
  const html = document.documentElement

  if (modo === 'app') html.dataset.app = ''
  else delete html.dataset.app

  // Escuro é a AUSÊNCIA do atributo — não um data-tema="escuro". Assim o
  // CSS só precisa de um seletor extra pro claro.
  if (tema === 'claro') html.dataset.tema = 'claro'
  else delete html.dataset.tema

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', COR_BARRA[modo][tema])
}

export function TemaProvider({ children }) {
  const modo = useCelular() ? 'app' : 'site'
  const [temas, setTemas] = useState(() => ({ site: lerSalvo('site'), app: lerSalvo('app') }))
  const tema = temas[modo]

  // Trocou de experiência (ou de tema): o <html> acompanha. Layout effect
  // porque roda antes da pintura — a troca site ↔ app não pisca.
  useLayoutEffect(() => {
    aplicarNoDocumento(modo, tema)
  }, [modo, tema])

  /* `origem` é o centro do botão que foi clicado, em pixels da tela. É de lá
     que o círculo do tema novo cresce. */
  const alternar = useCallback(
    (origem) => {
      const novo = tema === 'claro' ? 'escuro' : 'claro'

      const trocar = () => {
        aplicarNoDocumento(modo, novo)
        try {
          localStorage.setItem(CHAVES[modo], novo)
        } catch {
          // aba anônima: o tema funciona, só não sobrevive ao F5
        }
        // flushSync obriga o React a atualizar o DOM AGORA, dentro deste
        // callback. Sem ele, o React agendaria a atualização pra depois, o
        // navegador tiraria o "print" do tema novo com o ícone velho no
        // botão, e o ícone trocaria só depois da animação — um pulo visível.
        flushSync(() => setTemas((atual) => ({ ...atual, [modo]: novo })))
      }

      // data-leve: o visitante desligou as animações no interruptor (ModoLeveContext)
      const semAnimacao =
        !document.startViewTransition ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.hasAttribute('data-leve')

      // Firefox antigo, quem pediu menos movimento e o modo leve: troca seca,
      // sem círculo.
      if (semAnimacao || !origem) {
        trocar()
        return
      }

      const { x, y } = origem
      // raio que cobre a tela inteira a partir do botão: a distância até o
      // canto MAIS LONGE. Calcular em vez de chutar 150vmax evita o círculo
      // "acabar" antes de cobrir tudo em tela ultralarga.
      const raio = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      const transicao = document.startViewTransition(trocar)

      transicao.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${raio}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 620,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
    },
    [modo, tema],
  )

  const valor = useMemo(() => ({ tema, alternar }), [tema, alternar])

  return <TemaContext value={valor}>{children}</TemaContext>
}

export function useTema() {
  const contexto = useContext(TemaContext)

  if (!contexto) {
    throw new Error('useTema() precisa estar dentro de <TemaProvider>')
  }

  return contexto
}

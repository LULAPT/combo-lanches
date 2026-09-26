import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Cardapio from '@/pages/Cardapio'
import NavRail from '@/components/NavRail'
import BolhaCarrinho from '@/components/BolhaCarrinho'
import BotaoTema from '@/components/BotaoTema'
import CarrinhoDrawer from '@/components/CarrinhoDrawer'
import MarcaTexto from '@/components/MarcaTexto'
import BarraLeitura from '@/components/BarraLeitura'
import Rodape from '@/components/Rodape'
import Fagulhas from '@/components/Fagulhas'
import { useTema } from '@/context/TemaContext'
import { useCarrinho } from '@/context/CarrinhoContext'

/* ============================================================================
   SITE — o esqueleto do desktop e do tablet
   ----------------------------------------------------------------------------
   Celular não passa por aqui: ganha o app (src/app/AppCelular.jsx). Quem
   decide qual dos dois aparece é o App.jsx.

   Tudo que aparece em QUALQUER tela do site mora aqui. As páginas dentro de
   <Routes> trocam; o resto fica.

     NavRail        trilho de vidro, colado na borda direita
     BolhaCarrinho  sacola flutuante, nasce com o 1º item (canto sup. esq.)
     BotaoTema      claro/escuro, sempre visível (canto inf. esq.)
     CarrinhoDrawer painel do pedido, sempre montado e fechado
     MarcaTexto     a seleção de texto vira traço de caneta (Lidera360)
     BarraLeitura   o fio de progresso da rolagem, no topo (Lidera360)
     Rodape         só na landing

     Fagulhas       cada clique solta fagulhas no ponto tocado (o ClickSpark
                    reescrito — ver Fagulhas.jsx). A cor é o acento de cada
                    tema: o vermelho do escuro some no fundo claro.

   ENDEREÇOS DO APP: /combo, /loja e /sacola são abas do app do celular.
   Alguém que abre um desses links no computador cai na seção equivalente
   da landing (ou no carrinho aberto), em vez de ver a landing do zero.
   ========================================================================== */
export default function Site() {
  const { tema } = useTema()

  return (
    <>
      {/* primeiro de tudo e sem z-index: é o que põe as fagulhas atrás de
          tudo que tem z-index, como antes (ver Fagulhas.jsx) */}
      <Fagulhas cor={tema === 'escuro' ? '#e64f37' : '#c4351f'} />
      <RolagemDeRota />
      <BarraLeitura />

      <NavRail />
      <BolhaCarrinho />
      <BotaoTema />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Landing />
              <Rodape />
            </>
          }
        />
        <Route path="/cardapio" element={<Cardapio />} />
        <Route path="/combo" element={<Navigate to="/#combo" replace />} />
        <Route path="/loja" element={<Navigate to="/#contato" replace />} />
        <Route path="/sacola" element={<AbrirSacola />} />

        {/* Qualquer URL desconhecida cai na landing em vez de tela branca. */}
        <Route
          path="*"
          element={
            <>
              <Landing />
              <Rodape />
            </>
          }
        />
      </Routes>

      <CarrinhoDrawer />
      <MarcaTexto />
    </>
  )
}

// /sacola no site: a landing, com a gaveta do carrinho já aberta
function AbrirSacola() {
  const { abrir } = useCarrinho()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => abrir(), [])

  return <Navigate to="/" replace />
}

/* ----------------------------------------------------------------------------
   ROLAGEM AO TROCAR DE ROTA
   O React Router não mexe na rolagem quando você navega. Este componente
   resolve: com #âncora, rola até a seção; sem, volta pro topo.

   POR QUE NÃO scrollIntoView
   As seções da landing são sticky. Uma seção que você JÁ passou continua
   "grudada" no topo, só que coberta pelas seguintes — e pro navegador ela
   já está visível, então scrollIntoView não faz nada. Clicar "Monte seu
   combo" lá do rodapé simplesmente não subiria.

   A saída é calcular onde a seção estaria SEM o sticky: o topo da .pilha
   mais a altura de todas as irmãs que vêm antes dela. Como elas estão em
   fluxo normal, essa soma é exata.

   `key` nas dependências: clicar duas vezes no mesmo link não muda
   pathname nem hash, mas muda a key da navegação — sem ela, o segundo
   clique não rolaria.

   VOLTAR PRO TOPO: deslizando ou pulando?
   "Início" clicado DENTRO da landing desliza até a hero, como as outras
   seções. Chegando de OUTRA página (ou no primeiro carregamento), a página
   já nasce no topo — deslizar ali seria rolar uma página que você nem viu.
   Por isso a rota anterior fica guardada num ref (null = primeira vez).
-------------------------------------------------------------------------- */
function RolagemDeRota() {
  const { pathname, hash, key } = useLocation()
  const rotaAnterior = useRef(null)

  useEffect(() => {
    const mesmaPagina = rotaAnterior.current === pathname
    rotaAnterior.current = pathname

    if (!hash) {
      window.scrollTo({ top: 0, behavior: mesmaPagina ? 'smooth' : 'instant' })
      return
    }

    // Um tick pra página nova montar antes de procurar a seção nela.
    const id = setTimeout(() => {
      const alvo = document.querySelector(hash)
      if (!alvo) return

      const pilha = alvo.parentElement?.classList.contains('pilha') ? alvo.parentElement : null
      let topo

      if (pilha) {
        topo = pilha.getBoundingClientRect().top + window.scrollY
        for (const irma of pilha.children) {
          if (irma === alvo) break
          topo += irma.offsetHeight
        }
      } else {
        topo = alvo.getBoundingClientRect().top + window.scrollY
      }

      window.scrollTo({ top: topo, behavior: 'smooth' })
    }, 60)

    return () => clearTimeout(id)
  }, [pathname, hash, key])

  return null
}

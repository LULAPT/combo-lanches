import { useLocation } from 'react-router-dom'
import { useSecaoAtiva } from '@/hooks/useSecaoAtiva'

/* ============================================================================
   DESTINOS DA NAVEGAÇÃO DO SITE (o trilho de vidro, NavRail.jsx)
   ----------------------------------------------------------------------------
   Duas famílias de destino, separadas de propósito na navegação:
   SEÇÕES   âncoras DENTRO da landing — a bolinha de ativo segue a rolagem
   CARDÁPIO outra PÁGINA — mora fora do grupo, junto do Instagram no
            trilho. Misturar os dois na mesma fileira dava a entender que
            o cardápio era mais uma seção.

   (O celular tem navegação própria, a barra de abas do app —
   src/app/abas.js.)
   ========================================================================== */
export const LINKS_NAV = [
  { id: 'inicio', rotulo: 'Início', para: '/' },
  { id: 'burgers', rotulo: 'Burgers', para: '/#burgers' },
  { id: 'combo', rotulo: 'Monte seu combo', para: '/#combo' },
  { id: 'contato', rotulo: 'Onde estamos', para: '/#contato' },
]

export const LINK_CARDAPIO = { id: 'cardapio', rotulo: 'Cardápio', para: '/cardapio' }

/* Qual link está ativo. Na landing, quem decide é a SEÇÃO NA TELA (não o
   #hash da URL): você clica em "Burgers", mas se depois rolar até o combo,
   a bolinha vai junto pro combo. Fora da landing, vale a rota. */
export function useLinkAtivo() {
  const { pathname } = useLocation()
  const secao = useSecaoAtiva()

  return (link) => {
    if (link.para === '/cardapio') return pathname === '/cardapio'
    return pathname === '/' && link.id === (secao ?? 'inicio')
  }
}

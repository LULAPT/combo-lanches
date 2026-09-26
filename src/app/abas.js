import { BookOpen, House, ShoppingBag, Store } from 'lucide-react'

/* ============================================================================
   AS ABAS DO APP
   ----------------------------------------------------------------------------
   A barra de baixo (NavInferior.jsx) e as telas (AppCelular.jsx) leem daqui.
   Cada aba é um ENDEREÇO de verdade: o botão voltar do Android funciona, e
   dá pra mandar o link de uma aba pra alguém.

   A do meio é a marca: a logo da casa num botão elevado, que leva pro
   Monte seu combo. É o nome da loja — então é a ação principal do app.
   ========================================================================== */
export const ABAS = [
  { id: 'inicio', caminho: '/', rotulo: 'Início', Icone: House },
  { id: 'cardapio', caminho: '/cardapio', rotulo: 'Cardápio', Icone: BookOpen },
  { id: 'combo', caminho: '/combo', rotulo: 'Combo', centro: true },
  { id: 'sacola', caminho: '/sacola', rotulo: 'Sacola', Icone: ShoppingBag },
  { id: 'loja', caminho: '/loja', rotulo: 'Loja', Icone: Store },
]

export const indiceDaAba = (id) => ABAS.findIndex((aba) => aba.id === id)

// "/cardapio/" e "/cardapio" são a mesma aba
export function abaDoCaminho(pathname) {
  const limpo = pathname.replace(/\/+$/, '') || '/'
  return ABAS.find((aba) => aba.caminho === limpo)?.id ?? null
}

/* Links do SITE abertos no celular. A landing usa âncoras (/#combo); no
   app cada uma dessas vira uma aba. Quem manda o link do computador pro
   celular cai no lugar certo. */
export const ANCORA_PARA_ABA = {
  '#inicio': '/',
  '#burgers': '/cardapio?cat=hamburgueres',
  '#combo': '/combo',
  '#contato': '/loja',
}

/* O fundo pastel de cada categoria (tokens tom-* do index.css). Classe
   escrita por extenso: o Tailwind só gera o que ele encontra no código. */
export const TOM = {
  hamburgueres: 'bg-tom-hamburgueres',
  acompanhamentos: 'bg-tom-acompanhamentos',
  bebidas: 'bg-tom-bebidas',
}

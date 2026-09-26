import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCardapio } from '@/hooks/useCardapio'

/* ============================================================================
   useItemAberto — qual produto está aberto na folha (FolhaItem.jsx)?
   ----------------------------------------------------------------------------
   O produto aberto mora na URL: /cardapio?item=x-tudo. Três vantagens:
     - o botão VOLTAR do celular fecha a folha (e não sai do site);
     - dá pra mandar o link de um lanche pra alguém;
     - a folha abre por cima de QUALQUER aba sem ela precisar saber.

   FECHAR: se fomos nós que abrimos (state.folha), fechar é voltar uma
   entrada no histórico — igual ao gesto de voltar. Se a pessoa chegou por
   um link que já veio com ?item=, não há pra onde voltar dentro do site:
   aí a gente só tira o ?item= da URL.
   ========================================================================== */
export function useItemAberto() {
  const { pathname, search, state } = useLocation()
  const navigate = useNavigate()
  const { itens } = useCardapio()

  const id = new URLSearchParams(search).get('item')
  const item = id ? (itens.find((i) => i.id === id) ?? null) : null

  const abrir = useCallback(
    (novoId) => {
      const parametros = new URLSearchParams(search)
      parametros.set('item', novoId)
      navigate({ pathname, search: `?${parametros}` }, { state: { folha: true } })
    },
    [navigate, pathname, search],
  )

  const fechar = useCallback(() => {
    if (state?.folha) {
      navigate(-1)
      return
    }
    const parametros = new URLSearchParams(search)
    parametros.delete('item')
    const resto = parametros.toString()
    navigate({ pathname, search: resto ? `?${resto}` : '' }, { replace: true })
  }, [navigate, pathname, search, state])

  return { item, abrir, fechar }
}

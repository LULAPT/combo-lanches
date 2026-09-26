import { useMemo } from 'react'
import { CATEGORIAS, ITENS } from '@/data/cardapio'

/* ============================================================================
   useCARDAPIO — a única porta de entrada dos dados do cardápio
   ----------------------------------------------------------------------------
   Nenhuma página importa `ITENS` direto. Todas passam por aqui.

   Parece burocracia agora que os dados são um arquivo local, mas é exatamente
   isso que vai salvar o dia quando o back-end existir: trocar o `ITENS`
   importado por um `useQuery('/api/cardapio')` acontece DENTRO deste arquivo,
   e nenhuma página precisa ser tocada. Se cada tela importasse os dados
   direto, a migração mexeria em todas elas.

   `normalizar` tira acento pra busca. Sem isso, procurar "hamburguer" não
   acha "Hambúrguer" — e ninguém digita acento no celular com a mão
   engordurada de batata frita.
-------------------------------------------------------------------------- */

const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export function useCardapio({ busca = '', categoria = null } = {}) {
  return useMemo(() => {
    const termo = normalizar(busca)

    const filtrados = ITENS.filter((item) => {
      const combinaCategoria = !categoria || item.categoria === categoria

      const combinaBusca =
        !termo ||
        normalizar(item.nome).includes(termo) ||
        normalizar(item.descricao).includes(termo)

      return combinaCategoria && combinaBusca
    })

    /* Agrupa por categoria mantendo a ordem de CATEGORIAS — e joga fora as
       categorias que ficaram sem nenhum item depois do filtro, senão a busca
       por "frango" mostraria cinco títulos de seção vazios. */
    const grupos = CATEGORIAS.map((cat) => ({
      ...cat,
      itens: filtrados.filter((item) => item.categoria === cat.id),
    })).filter((grupo) => grupo.itens.length > 0)

    return {
      grupos,
      categorias: CATEGORIAS,
      itens: filtrados,
      total: filtrados.length,
      maisPedidos: ITENS.filter((item) => item.maisPedido && !item.esgotado),
      semResultado: filtrados.length === 0,
    }
  }, [busca, categoria])
}

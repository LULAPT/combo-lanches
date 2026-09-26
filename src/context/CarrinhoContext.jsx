/* ============================================================================
   CARRINHO — estado global do pedido
   ----------------------------------------------------------------------------
   AULA RÁPIDA (leia uma vez, depois é só usar):

   Em JS puro você guardaria o carrinho numa variável global e chamaria
   `renderCarrinho()` na mão toda vez que mudasse algo. O risco é sempre o
   mesmo: você altera o array e esquece de chamar o render em um dos caminhos,
   e a tela fica mentindo.

   Em React você não redesenha nada na mão. Você declara "este componente
   depende do carrinho" e o React redesenha sozinho quando o carrinho muda.
   Três peças fazem isso funcionar:

   1. useReducer — em vez de espalhar `carrinho.push(...)` pela aplicação,
      TODA mudança vira uma mensagem ("adicionar isto", "remover aquilo") que
      passa por uma função só: o `reducer` aqui embaixo. Quando o carrinho
      bugar, você sabe exatamente onde olhar — é o único lugar que escreve.

   2. Context — evita passar `carrinho` de componente em componente até
      chegar no botão lá no fundo da árvore. O Provider embrulha o app inteiro
      e qualquer componente puxa o que precisa com useCarrinho().

   3. Imutabilidade — o reducer NUNCA altera o estado que recebeu. Ele sempre
      devolve um objeto novo. É por isso que você vê `[...estado.itens]` e
      `{ ...linha }` toda hora. Se você fizer `estado.itens.push(x)` o React
      compara o array com ele mesmo, conclui que nada mudou e não redesenha —
      esse é o bug nº 1 de quem vem de JS puro.
   ========================================================================== */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { ADICIONAIS, camadasDoPedido } from '@/data/cardapio'

/* O `:v1` no fim é proposital: se um dia o formato da linha do carrinho
   mudar, vire pra `:v2` e os carrinhos salvos no formato antigo são
   ignorados em vez de quebrarem a tela de quem tinha item guardado. */
const CHAVE_STORAGE = 'combo-lanches:carrinho:v1'

/* ----------------------------------------------------------------------------
   IDENTIDADE DA LINHA
   Dois "X Burguer" só são a mesma linha do carrinho se tiverem exatamente os
   mesmos adicionais. X Burguer com bacon e X Burguer sem bacon são linhas
   separadas, cada uma com sua quantidade.

   O sort() é essencial: sem ele, escolher {bacon, ovo} e {ovo, bacon} geraria
   duas linhas idênticas na tela, e o cliente veria o mesmo lanche duplicado.
-------------------------------------------------------------------------- */
function gerarLinhaId(itemId, adicionais) {
  const assinatura = Object.entries(adicionais)
    .filter(([, qtd]) => qtd > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, qtd]) => `${id}x${qtd}`)
    .join('|')

  return assinatura ? `${itemId}::${assinatura}` : itemId
}

/* Preço de uma linha = (item + adicionais) × quantidade.
   Recalculado a partir do ADICIONAIS atual em vez de guardar o preço no
   estado. Assim, se o preço de um adicional mudar no cardápio, carrinhos
   salvos no localStorage não ficam com valor velho. */
function calcularPrecoLinha(linha) {
  const extras = Object.entries(linha.adicionais).reduce((soma, [id, qtd]) => {
    const adicional = ADICIONAIS.find((a) => a.id === id)
    return adicional ? soma + adicional.preco * qtd : soma
  }, 0)

  return (linha.precoBase + extras) * linha.quantidade
}

const estadoInicial = { itens: [] }

/* ----------------------------------------------------------------------------
   O REDUCER
   Recebe (estadoAtual, ação) e devolve o estadoNovo. Função pura: mesmas
   entradas, mesma saída, sem fetch, sem localStorage, sem Math.random().
-------------------------------------------------------------------------- */
function reducer(estado, acao) {
  switch (acao.tipo) {
    case 'ADICIONAR': {
      const { item, adicionais = {}, quantidade = 1 } = acao
      const linhaId = gerarLinhaId(item.id, adicionais)
      const existente = estado.itens.find((l) => l.linhaId === linhaId)

      // Já existe uma linha idêntica? Só soma a quantidade, em vez de criar
      // uma segunda linha igual logo abaixo da primeira.
      if (existente) {
        return {
          itens: estado.itens.map((l) =>
            l.linhaId === linhaId
              ? { ...l, quantidade: l.quantidade + quantidade }
              : l,
          ),
        }
      }

      return {
        itens: [
          ...estado.itens,
          {
            linhaId,
            itemId: item.id,
            nome: item.nome,
            // o desenho do lanche JÁ com os extras — a sacola mostra o X-Tudo
            // com as duas tiras de bacon que o cliente pediu. null pra quem
            // não é hambúrguer (aí a sacola desenha pelo itemId).
            camadas: camadasDoPedido(item, adicionais),
            precoBase: item.preco,
            adicionais,
            quantidade,
          },
        ],
      }
    }

    case 'ALTERAR_QUANTIDADE': {
      const { linhaId, delta } = acao

      return {
        itens: estado.itens
          .map((l) =>
            l.linhaId === linhaId
              ? { ...l, quantidade: l.quantidade + delta }
              : l,
          )
          // chegou a zero = saiu do carrinho. Fazer isso aqui evita um
          // "0 unidades" fantasma na tela enquanto o componente decide remover.
          .filter((l) => l.quantidade > 0),
      }
    }

    case 'REMOVER':
      return { itens: estado.itens.filter((l) => l.linhaId !== acao.linhaId) }

    case 'LIMPAR':
      return estadoInicial

    case 'RESTAURAR':
      return { itens: acao.itens }

    default:
      // Erra o nome da ação e você descobre agora, não daqui a duas horas.
      throw new Error(`Ação desconhecida no carrinho: ${acao.tipo}`)
  }
}

const CarrinhoContext = createContext(null)

export function CarrinhoProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)

  // O drawer mora aqui e não em cada página porque qualquer botão de qualquer
  // tela precisa conseguir abrir o carrinho.
  const [aberto, setAberto] = useState(false)

  /* Restaura do localStorage UMA vez, na montagem.
     O array vazio `[]` no fim do useEffect é a lista de dependências: vazio
     significa "roda só quando o componente monta". Sem ele, o efeito rodaria
     a cada render e você teria um loop infinito. */
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE)
      if (salvo) {
        const itens = JSON.parse(salvo)
        if (Array.isArray(itens) && itens.length) {
          dispatch({ tipo: 'RESTAURAR', itens })
        }
      }
    } catch {
      // Aba anônima, storage cheio ou JSON corrompido: começar com o carrinho
      // vazio é melhor que quebrar a página inteira.
    }
  }, [])

  /* Salva sempre que `estado.itens` muda. O React compara a dependência por
     identidade — e como o reducer sempre devolve array novo, isso dispara
     certinho a cada alteração real e só nelas. */
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado.itens))
    } catch {
      // storage indisponível: o carrinho só não sobrevive ao F5
    }
  }, [estado.itens])

  /* useMemo evita recalcular os totais em todo render — e, mais importante,
     evita criar um objeto `valor` novo a cada render, o que faria TODOS os
     componentes que usam useCarrinho() redesenharem sem motivo. */
  const valor = useMemo(() => {
    const subtotal = estado.itens.reduce(
      (soma, linha) => soma + calcularPrecoLinha(linha),
      0,
    )
    const quantidadeTotal = estado.itens.reduce(
      (soma, linha) => soma + linha.quantidade,
      0,
    )

    return {
      itens: estado.itens,
      subtotal,
      quantidadeTotal,
      vazio: estado.itens.length === 0,
      aberto,
      abrir: () => setAberto(true),
      fechar: () => setAberto(false),
      adicionar: (item, adicionais, quantidade) =>
        dispatch({ tipo: 'ADICIONAR', item, adicionais, quantidade }),
      alterarQuantidade: (linhaId, delta) =>
        dispatch({ tipo: 'ALTERAR_QUANTIDADE', linhaId, delta }),
      remover: (linhaId) => dispatch({ tipo: 'REMOVER', linhaId }),
      limpar: () => dispatch({ tipo: 'LIMPAR' }),
      precoDaLinha: calcularPrecoLinha,
    }
  }, [estado.itens, aberto])

  return (
    <CarrinhoContext value={valor}>{children}</CarrinhoContext>
  )
}

/* Hook de acesso. Sempre exporte um hook em vez do Context cru: o erro
   abaixo já te salvou de meia hora procurando por que `subtotal` é undefined
   num componente que ficou fora do Provider. */
export function useCarrinho() {
  const contexto = useContext(CarrinhoContext)

  if (!contexto) {
    throw new Error('useCarrinho() precisa estar dentro de <CarrinhoProvider>')
  }

  return contexto
}

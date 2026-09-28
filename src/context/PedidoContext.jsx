/* ============================================================================
   PEDIDO EM ANDAMENTO — o que existe DEPOIS do pagamento
   ----------------------------------------------------------------------------
   Quando o pagamento (simulado) é confirmado, o pedido vira uma coisa que
   vive por conta própria: a janela de pagamento fecha, mas o pedido segue
   andando — recebido, em preparo, saiu pra entrega, entregue.

   Mora aqui, fora das telas, porque dois lugares olham pra ele:
     BolhaPedido      a bolinha da moto no canto superior direito, que fica
                      na tela enquanto há pedido — tocou, abre o rastreio
     RastreioPedido   a janela com a linha do tempo, que abre e fecha
                      quantas vezes quiser

   O pedido é salvo no localStorage: um F5 no meio da entrega não perde o
   rastreio. O ANDAMENTO não é salvo — é calculado pela hora em que o pedido
   foi feito (criadoEm), então ele continua certo mesmo com a janela
   fechada ou a aba em segundo plano (ver data/pedido.js).

   Entregue e o rastreio fechado depois disso → o pedido acaba e a bolinha
   some. Se ninguém abrir, ele sai sozinho 30 min depois de entregue.
   ========================================================================== */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DURACAO_PEDIDO_MS, ULTIMO_PASSO, passoSimulado } from '@/data/pedido'

const CHAVE_STORAGE = 'combo-lanches:pedido:v1'
const EXPIRA_DEPOIS_DE_ENTREGUE_MS = 30 * 60_000

const PedidoContext = createContext(null)

function lerSalvo() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE))
    if (!salvo?.codigo || !salvo.criadoEm) return null
    // entregue há muito tempo: não volta
    if (Date.now() - salvo.criadoEm > DURACAO_PEDIDO_MS + EXPIRA_DEPOIS_DE_ENTREGUE_MS) return null
    return salvo
  } catch {
    return null
  }
}

export function PedidoProvider({ children }) {
  const [pedido, setPedido] = useState(lerSalvo)
  const [rastreioAberto, setRastreioAberto] = useState(false)
  // o relógio do rastreio: anda de 1 em 1 segundo enquanto o pedido não chegou
  const [agora, setAgora] = useState(() => Date.now())

  const decorrido = pedido ? Math.max(0, agora - pedido.criadoEm) : 0
  const passo = pedido ? passoSimulado(decorrido) : 0
  const entregue = Boolean(pedido) && passo === ULTIMO_PASSO

  useEffect(() => {
    if (!pedido || entregue) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [pedido, entregue])

  /* data-pedido no <html> enquanto há pedido: no app, o CSS abre espaço
     no canto superior direito pra bolinha (index.css, bloco BOLINHA DO
     PEDIDO) — o botão de tema, os títulos e a busca saem da frente. */
  useEffect(() => {
    const html = document.documentElement
    if (pedido) html.dataset.pedido = ''
    else delete html.dataset.pedido
  }, [pedido])

  // salva (ou apaga) a cada mudança do pedido
  useEffect(() => {
    try {
      if (pedido) localStorage.setItem(CHAVE_STORAGE, JSON.stringify(pedido))
      else localStorage.removeItem(CHAVE_STORAGE)
    } catch {
      // aba anônima: o rastreio funciona, só não sobrevive ao F5
    }
  }, [pedido])

  // entregue e esquecido: sai sozinho
  useEffect(() => {
    if (!entregue) return
    const falta = pedido.criadoEm + DURACAO_PEDIDO_MS + EXPIRA_DEPOIS_DE_ENTREGUE_MS - Date.now()
    const id = setTimeout(() => setPedido(null), Math.max(0, falta))
    return () => clearTimeout(id)
  }, [entregue, pedido])

  /* O pagamento chama isto na hora em que confirma. `dados` é a "foto" do
     pedido: código, total, quantidade de itens, forma de pagamento. */
  const iniciarPedido = useCallback((dados) => {
    const criadoEm = Date.now()
    setAgora(criadoEm)
    setPedido((atual) => (atual?.codigo === dados.codigo ? atual : { ...dados, criadoEm }))
  }, [])

  const abrirRastreio = useCallback(() => {
    setAgora(Date.now())
    setRastreioAberto(true)
  }, [])

  // fechou o rastreio de um pedido JÁ ENTREGUE: acabou, a bolinha some
  const fecharRastreio = useCallback(() => {
    setRastreioAberto(false)
    if (entregue) setPedido(null)
  }, [entregue])

  const valor = useMemo(
    () => ({ pedido, passo, decorrido, entregue, rastreioAberto, iniciarPedido, abrirRastreio, fecharRastreio }),
    [pedido, passo, decorrido, entregue, rastreioAberto, iniciarPedido, abrirRastreio, fecharRastreio],
  )

  return <PedidoContext value={valor}>{children}</PedidoContext>
}

export function usePedido() {
  const contexto = useContext(PedidoContext)

  if (!contexto) {
    throw new Error('usePedido() precisa estar dentro de <PedidoProvider>')
  }

  return contexto
}

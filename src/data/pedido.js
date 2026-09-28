/* ============================================================================
   O PEDIDO EM ANDAMENTO — os passos do rastreio (SIMULADO)
   ----------------------------------------------------------------------------
   Pra equipe de back-end: este arquivo é o CONTRATO do rastreio.

   Hoje não existe servidor, então o andamento é calculado pelo relógio: o
   pedido nasce "recebido" na hora em que o pagamento é confirmado, e cada
   passo começa `inicioMs` depois disso (passoSimulado, lá embaixo). O total
   dá uns 2,5 minutos — devagar o bastante pra ver cada etapa acontecendo.

   QUANDO O BACK-END EXISTIR: o servidor devolve o status do pedido (ex.:
   GET /pedidos/CL-4821 → { status: 'preparo' }), por polling ou websocket.
   Aí é trocar o passoSimulado por "o índice do passo com esse id" dentro do
   PedidoContext (usePassoDoPedido) — e as telas (a bolinha da moto e a
   janela de rastreio) continuam iguais. Os `id` abaixo são os status que o
   front espera receber.
   ========================================================================== */

export const PASSOS_PEDIDO = [
  { id: 'recebido', titulo: 'Pedido recebido', texto: 'A loja já está com o seu pedido', inicioMs: 0 },
  { id: 'preparo', titulo: 'Em preparo', texto: 'A chapa já está esquentando', inicioMs: 20_000 },
  { id: 'caminho', titulo: 'Saiu pra entrega', texto: 'O entregador está a caminho', inicioMs: 75_000 },
  { id: 'entregue', titulo: 'Entregue!', texto: 'Bom apetite', inicioMs: 150_000 },
]

export const ULTIMO_PASSO = PASSOS_PEDIDO.length - 1
export const DURACAO_PEDIDO_MS = PASSOS_PEDIDO[ULTIMO_PASSO].inicioMs

/* Em que passo o pedido está, `decorrido` ms depois de confirmado: o último
   passo cujo início já chegou. */
export function passoSimulado(decorrido) {
  let passo = 0
  PASSOS_PEDIDO.forEach(({ inicioMs }, i) => {
    if (decorrido >= inicioMs) passo = i
  })
  return passo
}

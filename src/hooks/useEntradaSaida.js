import { useEffect, useState } from 'react'

/* ============================================================================
   useEntradaSaida — abrir/fechar uma janela com as classes do dropdown
   ----------------------------------------------------------------------------
   As classes .t-dropdown / .is-open / .is-closing (index.css, bloco
   PAGAMENTO SIMULADO): monta sem .is-open (o estado de partida, 97% e
   invisível), espera o navegador desenhar isso e aí põe .is-open; ao
   fechar, troca por .is-closing e só desmonta depois que a saída terminou.

   Usado pela janela de pagamento (Pagamento.jsx) e pela de rastreio
   (RastreioPedido.jsx) — as duas entram e saem do mesmo jeito.
   ========================================================================== */
const SAIDA_MS = 150 // a --dropdown-close-dur do CSS

export function useEntradaSaida(aberto) {
  const [fase, setFase] = useState(aberto ? 'aberto' : 'fechado')
  const [anterior, setAnterior] = useState(aberto)

  // o jeito do React de "reagir a uma prop que mudou" sem efeito: ajusta o
  // estado durante o próprio render
  if (aberto !== anterior) {
    setAnterior(aberto)
    setFase(aberto ? 'entrando' : 'saindo')
  }

  useEffect(() => {
    if (fase === 'entrando') {
      // dois quadros: o primeiro desenha o estado de partida
      let segundo
      const primeiro = requestAnimationFrame(() => {
        segundo = requestAnimationFrame(() => setFase('aberto'))
      })
      return () => {
        cancelAnimationFrame(primeiro)
        cancelAnimationFrame(segundo)
      }
    }
    if (fase === 'saindo') {
      const id = setTimeout(() => setFase('fechado'), SAIDA_MS)
      return () => clearTimeout(id)
    }
  }, [fase])

  return {
    montado: fase !== 'fechado',
    classe: fase === 'aberto' ? 'is-open' : fase === 'saindo' ? 'is-closing' : '',
  }
}

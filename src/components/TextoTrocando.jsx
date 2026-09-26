import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   TEXTO TROCANDO — o "text states swap" do Transitions.dev
   ----------------------------------------------------------------------------
   Um texto que, quando muda, não pula: o velho sobe, desfoca e some; o novo
   entra vindo de baixo, desfocado, e assenta. O CSS está no index.css
   (.t-text-swap); aqui fica a sequência em três tempos que ele pede:

   1. texto novo chegou → classe .is-exit no velho (sobe e some, 150ms)
   2. passados os 150ms → troca o texto e põe .is-enter-start: o novo vai
      pra baixo NA HORA (essa classe desliga a transição)
   3. força o navegador a desenhar essa posição (a leitura de offsetWidth)
      e tira .is-enter-start → o novo anima de baixo pro lugar

   O passo 3 é o mesmo cuidado do marca-texto: sem forçar o desenho no meio,
   o navegador junta "vai pra baixo" e "volta pro lugar" num passo só, e o
   texto aparece sem animar.

   aria-live="polite": quem usa leitor de tela ouve a mudança de status
   ("Aguardando pagamento…", "Pagamento confirmado!") sem ter que procurar.
   ========================================================================== */
export default function TextoTrocando({ texto, className = '' }) {
  const ref = useRef(null)
  const [mostrado, setMostrado] = useState(texto)
  const reduzido = useMenosMovimento()

  // passo 1: o texto de fora mudou → o velho sai
  useEffect(() => {
    if (texto === mostrado) return
    const el = ref.current
    const duracao = reduzido ? 0 : parseFloat(getComputedStyle(el).getPropertyValue('--text-swap-dur')) || 150
    if (!reduzido) el.classList.add('is-exit')
    const id = setTimeout(() => setMostrado(texto), duracao)
    return () => clearTimeout(id)
  }, [texto, mostrado, reduzido])

  // passos 2 e 3: o texto novo já está no DOM → entra de baixo
  useLayoutEffect(() => {
    const el = ref.current
    if (!el.classList.contains('is-exit')) return
    el.classList.remove('is-exit')
    el.classList.add('is-enter-start')
    void el.offsetWidth
    el.classList.remove('is-enter-start')
  }, [mostrado])

  return (
    <span ref={ref} aria-live="polite" className={`t-text-swap ${className}`}>
      {mostrado}
    </span>
  )
}

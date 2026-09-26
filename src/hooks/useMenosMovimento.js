import { useReducedMotion } from 'motion/react'
import { useModoLeve } from '@/context/ModoLeveContext'

/* ============================================================================
   useMenosMovimento — devo animar ou não?
   ----------------------------------------------------------------------------
   Duas fontes pra mesma resposta:
     sistema   o visitante pediu "reduzir movimento" no celular/computador
     site      o visitante desligou as animações no interruptor (modo leve)

   Qualquer uma das duas basta. Todo componente que antes perguntava só ao
   sistema (useReducedMotion) pergunta aqui — assim o interruptor desliga
   exatamente o que o "menos movimento" do sistema já desligava, sem cada
   componente precisar saber que existem duas fontes.
   ========================================================================== */
export function useMenosMovimento() {
  const sistema = useReducedMotion()
  const { leve } = useModoLeve()

  return Boolean(sistema) || leve
}

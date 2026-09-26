import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { formatarPreco } from '@/data/cardapio'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   PREÇO ANIMADO
   ----------------------------------------------------------------------------
   Seção 06 do PDF: "Mudanças de número (preço, quantidade, contadores) são
   animadas, nunca trocadas instantaneamente".

   O ReactBits tem o CountUp, mas ele dispara uma vez quando entra na tela e
   para. Aqui o valor muda o tempo todo (cada clique no + do carrinho), então
   precisamos de algo que persiga o valor novo de onde estiver.

   É isso que o useSpring faz: ele é um número que não pula pro destino, vai
   sendo puxado até lá com física de mola. Trocar R$ 25,00 por R$ 32,00 no
   meio da animação não reinicia nada — a mola só muda de alvo.
   ========================================================================== */
export default function Preco({ valor, className = '' }) {
  const reduzido = useMenosMovimento()

  const alvo = useMotionValue(valor)
  const suave = useSpring(alvo, { stiffness: 220, damping: 32, mass: 0.6 })

  // useTransform cria um valor derivado: sempre que `suave` muda, isso
  // reformata pra "R$ 32,00". Nada disso passa pelo React — a Motion escreve
  // direto no DOM, então mexer no preço não redesenha o componente.
  const texto = useTransform(suave, (v) => formatarPreco(v))

  useEffect(() => {
    alvo.set(valor)
  }, [valor, alvo])

  // Quem pediu menos movimento recebe o número trocado na hora.
  if (reduzido) {
    return <span className={className}>{formatarPreco(valor)}</span>
  }

  return (
    <motion.span className={className} aria-label={formatarPreco(valor)}>
      {texto}
    </motion.span>
  )
}

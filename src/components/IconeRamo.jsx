import { motion } from 'motion/react'

/* ============================================================================
   ÍCONE DE RAMO — a setinha que desce e vira pra direita
   ----------------------------------------------------------------------------
   Uma linha que DESCE e faz uma curva arredondada pra direita, como um
   galho saindo do item de cima (o nome da categoria) e apontando pro de
   baixo ("5 opções"). Desenhada a partir de um rascunho do Marco no Paint:
   é o "↳" sem a ponta de seta, com a quina redonda — não existe como
   caractere comum, então é SVG.

   A linha de baixo fica EXATAMENTE no meio vertical da caixa: num flex com
   items-center, ela cai na altura do meio das letras do texto ao lado. A
   metade de cima é a subida do galho; a de baixo, vazia de propósito.

   Mesma API dos ícones do lucide (size, strokeWidth, className) — ver
   também IconeInstagram.jsx e IconeFritas.jsx. A cor vem do currentColor.

   Um extra: `variantesTraco` vai direto pro traço (um motion.path), pra
   quem usa o ramo poder DESENHAR a linha com pathLength — é o que o "5
   opções" dos ladrilhos do app faz (telas/Inicio.jsx). Sem ela, o traço é
   um path comum, parado.
   ========================================================================== */
export default function IconeRamo({ size = 16, strokeWidth = 2.6, className = '', variantesTraco }) {
  return (
    <svg
      width={size * (14 / 18)}
      height={size}
      viewBox="0 0 14 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 overflow-visible ${className}`}
    >
      {/* desce da borda de cima até a curva e segue reto pra direita, na
          altura do meio da caixa (y = 9) */}
      <motion.path d="M2.5 1.5V4.5A4.5 4.5 0 0 0 7 9H13" variants={variantesTraco} />
    </svg>
  )
}

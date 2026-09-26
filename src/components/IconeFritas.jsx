/* ============================================================================
   ÍCONE DE BATATA FRITA — o lucide não tem um
   ----------------------------------------------------------------------------
   Mesmo traço dos ícones dele (24×24, stroke 2, pontas redondas) e a mesma
   API (size, strokeWidth, className) pra não destoar ao lado. Usado nas
   pílulas de categoria do cardápio: no site (pages/Cardapio.jsx) e no app
   (src/app/telas/Cardapio.jsx).
   ========================================================================== */
export default function IconeFritas({ size = 18, strokeWidth = 2, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 11h14l-1.6 9.2a1 1 0 0 1-1 .8H7.6a1 1 0 0 1-1-.8Z" />
      <path d="M8 11 7 4M11 11V3M14 11l1-7M17 11l1.5-5" />
    </svg>
  )
}

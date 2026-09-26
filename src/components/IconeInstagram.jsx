/* ============================================================================
   ÍCONE DO INSTAGRAM
   ----------------------------------------------------------------------------
   Desenhado à mão porque o lucide-react removeu TODOS os ícones de marca a
   partir da v1 (questão de marca registrada — não é bug nem versão quebrada).
   `import { Instagram } from 'lucide-react'` hoje derruba a página inteira
   com "does not provide an export named 'Instagram'".

   As props espelham as do lucide (`size`, `strokeWidth`) pra ele ser
   intercambiável com os outros ícones, e `currentColor` faz ele herdar a cor
   do texto igual aos demais.
   ========================================================================== */
export default function IconeInstagram({ size = 20, strokeWidth = 2.2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

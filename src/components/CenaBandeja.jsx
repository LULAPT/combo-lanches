/* ============================================================================
   CENA DA BANDEJA
   ----------------------------------------------------------------------------
   O "palco" onde a comida pousa: um painel com grão, uma luz vindo de cima e
   a bandeja (uma elipse com borda e sombra por dentro) perto da base.

   Nasceu no Monte seu Combo e agora também abre o carrinho. Mora num
   componente só pra que as duas bandejas nunca fiquem diferentes — mudou a
   luz aqui, mudou nas duas (checklist da seção 07: sem duplicidade).

   Ela não sabe NADA do que está em cima dela: quem usa põe a comida como
   `children`, posicionada do jeito que precisar. O tamanho (aspect-ratio,
   sticky) também vem de fora, pelo `className`.
   ========================================================================== */
export default function CenaBandeja({ rotulo, className = '', children }) {
  return (
    <div className={`relative overflow-hidden rounded-mordida border border-linha bg-painel textura ${className}`}>
      {rotulo && (
        <span className="absolute top-4 left-5 font-script text-2xl text-texto-suave">{rotulo}</span>
      )}

      {/* luz de cima + a bandeja */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,color-mix(in_oklab,var(--color-texto)_5%,transparent),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[5%] bottom-[6%] h-[24%] rounded-[50%] border border-linha bg-painel-2
                   shadow-[inset_0_-12px_28px_rgb(0_0_0/0.28)]"
      />

      {children}
    </div>
  )
}

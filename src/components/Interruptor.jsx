/* ============================================================================
   INTERRUPTOR — a chavinha liga/desliga
   ----------------------------------------------------------------------------
   Só o DESENHO (trilho + bolinha). Quem usa embrulha num <button
   role="switch" aria-checked> — é o botão que o leitor de tela anuncia
   como "chave, ligada/desligada"; a chavinha é aria-hidden.

   Hoje serve o interruptor "Animações" (modo leve), no trilho do desktop e
   no rodapé do celular. Discreta de propósito: cinza, sem o vermelho da
   casa — é ajuste, não ação principal.

   Ligada: bolinha à direita, clara, trilho preenchido.
   Desligada: bolinha à esquerda, apagada, trilho só com a borda.
   ========================================================================== */
export default function Interruptor({ ligado }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[18px] w-8 shrink-0 items-center rounded-full border px-[2px] transition-colors ${
        ligado ? 'border-transparent bg-texto-suave/35' : 'border-linha bg-transparent'
      }`}
    >
      <span
        className={`size-3 rounded-full transition-[translate,background-color] duration-200 ease-(--ease-mordida) ${
          ligado ? 'translate-x-[14px] bg-texto' : 'translate-x-0 bg-texto-suave'
        }`}
      />
    </span>
  )
}

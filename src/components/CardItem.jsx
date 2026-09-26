import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatarPreco } from '@/data/cardapio'
import Ilustracao, { escalaDe } from '@/components/Ilustracao'

/* ============================================================================
   CARD DE ITEM
   ----------------------------------------------------------------------------
   Seção 05 do PDF: "imagem, informação principal e ação — usado em toda
   listagem".

   A "imagem" é uma VITRINE: um pedaço de balcão com um holofote e a sombra
   do produto no chão. O produto pousa na base dela — por isso tudo é
   alinhado embaixo (items-end), como numa prateleira. Hambúrguer é o
   MiniBurger (abre no hover); o resto é o desenho do Ilustracao.jsx, na
   altura relativa de cada um (lata baixinha, 2L alto).

   TRÊS FORMATOS — e cada um é diferente no celular e no desktop:

     destaque   hambúrgueres
     produto    acompanhamentos
                celular: linha (vitrine à esquerda, texto à direita), pra
                         caber a descrição inteira
                desktop: coluna (vitrine grande em cima)

     compacto   bebidas — 19 itens, quase sem descrição
                sempre coluna, vitrine baixa, cabe em grade de 2 no celular
                e de 5 no desktop

   O card inteiro é um <button>: um <div onClick> parece igual na tela mas
   não recebe foco pelo Tab e não dispara com Enter.
   ========================================================================== */
export default function CardItem({ item, onAbrir, formato = 'produto' }) {
  const [aberto, setAberto] = useState(false)
  const { nome, descricao, preco, esgotado, camadas } = item
  const compacto = formato === 'compacto'

  return (
    <button
      type="button"
      onClick={() => onAbrir(item)}
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
      onFocus={() => setAberto(true)}
      onBlur={() => setAberto(false)}
      disabled={esgotado}
      className={`group relative flex h-full w-full overflow-hidden rounded-mordida border border-linha bg-painel
                  text-left transition-colors hover:border-texto-suave/40 disabled:cursor-not-allowed
                  ${compacto ? 'flex-col' : 'flex-row sm:flex-col'}`}
    >
      {/* ---------------- VITRINE ---------------- */}
      <span
        aria-hidden="true"
        className={`textura relative flex shrink-0 justify-center overflow-hidden bg-painel-2 ${
          compacto
            ? 'h-36 items-end pb-4'
            : 'w-28 items-center py-4 sm:h-52 sm:w-full sm:items-end sm:pb-6'
        }`}
      >
        {/* holofote: luz quente vinda de cima, mais forte perto do produto */}
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_65%_60%_at_50%_78%,color-mix(in_oklab,var(--color-texto)_6%,transparent),transparent)]" />

        {/* sombra do produto no balcão */}
        <span
          className={`absolute left-1/2 h-3 w-[46%] -translate-x-1/2 rounded-[50%]
                      bg-[radial-gradient(closest-side,var(--sombra-burger),transparent)]
                      ${compacto ? 'bottom-3' : 'bottom-3 sm:bottom-5'}`}
        />

        {camadas ? (
          <span className={`relative ${compacto ? 'w-[46%]' : 'w-[82%] sm:w-[44%]'}`}>
            <Ilustracao item={item} aberto={aberto} />
          </span>
        ) : (
          <span
            className="relative flex items-end transition-transform duration-500 ease-(--ease-mordida)
                       group-hover:-translate-y-1.5 group-hover:-rotate-3"
            style={{ height: `${escalaDe(item.id)}%` }}
          >
            <Ilustracao item={item} className="block h-full w-auto overflow-visible" />
          </span>
        )}

        {esgotado && (
          <span className="absolute inset-0 grid place-items-center bg-fundo/60 backdrop-grayscale">
            <span className="rounded-pill border border-linha bg-painel px-3 py-1 text-[11px] font-bold tracking-wide text-texto-suave uppercase">
              Esgotado
            </span>
          </span>
        )}
      </span>

      {/* ---------------- TEXTO ---------------- */}
      <span className={`flex min-w-0 flex-1 flex-col gap-1 ${compacto ? 'p-3.5' : 'p-4 sm:p-5'}`}>
        <span
          className={`font-display leading-tight tracking-wide text-texto uppercase ${
            compacto ? 'text-base' : 'text-lg sm:text-xl'
          }`}
        >
          {nome}
        </span>

        {/* line-clamp corta com reticências: sem isso uma descrição gigante
            estica o card e desalinha a grade inteira */}
        <span
          className={`text-texto-suave ${
            compacto ? 'line-clamp-2 text-xs' : 'line-clamp-3 text-[13px] leading-snug sm:line-clamp-2'
          }`}
        >
          {descricao}
        </span>

        <span className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span
            className={`font-display font-semibold text-texto tabular-nums ${
              compacto ? 'text-lg' : 'text-xl'
            }`}
          >
            {formatarPreco(preco)}
          </span>

          {!esgotado && (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full border border-linha text-texto
                         transition-colors duration-200 group-hover:border-transparent group-hover:bg-botao
                         group-hover:text-white group-active:scale-90"
            >
              <Plus size={17} strokeWidth={2.6} />
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

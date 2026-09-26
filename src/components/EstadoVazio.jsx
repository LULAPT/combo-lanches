import { motion } from 'motion/react'
import { UtensilsCrossed } from 'lucide-react'

/* ============================================================================
   ESTADO VAZIO
   ----------------------------------------------------------------------------
   Seção 05 do PDF: "padrão único para qualquer lista sem conteúdo, com
   caminho de saída claro". Um componente só, usado no carrinho vazio e na
   busca sem resultado — é o que garante que os dois não fiquem diferentes.

   O "caminho de saída" é obrigatório: uma tela vazia sem botão deixa o
   usuário sem saber o que fazer, e ele fecha o site.

   `icone` é um ícone do lucide (ou qualquer elemento), num círculo que
   flutua devagar. Já foi um emoji — trocado pra combinar com o resto do
   site, que não usa emoji em lugar nenhum.

   `icone={false}`: sem círculo nenhum — pra quando a tela já tem a própria
   ilustração do vazio logo acima (o carrinho mostra a bandeja vazia).
   ========================================================================== */
export default function EstadoVazio({ icone, titulo, texto, acao }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-3 px-6 py-16 text-center"
    >
      {icone !== false && (
        <span
          aria-hidden="true"
          className="mb-2 grid size-20 animate-flutua place-items-center rounded-full border border-linha
                     bg-painel text-acento"
        >
          {icone ?? <UtensilsCrossed size={30} />}
        </span>
      )}

      {/* font-display font-bold: no site não muda nada (o h3 do site já é
          Oswald 700); no app, é o que dá peso ao título (index.css, APP) */}
      <h3 className="font-display text-2xl font-bold text-texto">{titulo}</h3>

      {texto && <p className="max-w-[34ch] text-sm leading-relaxed text-texto-suave">{texto}</p>}

      {acao}
    </motion.div>
  )
}

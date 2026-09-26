import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Bike, Clock, Sparkles } from 'lucide-react'
import { LOJA } from '@/data/cardapio'
import { useModoLeve } from '@/context/ModoLeveContext'
import { LogoMontando } from '@/components/Logo'
import IconeInstagram from '@/components/IconeInstagram'
import Interruptor from '@/components/Interruptor'
import { cascata, subir } from '@/app/animacoes'

/* ============================================================================
   LOJA — quem é, onde fica, como falar com ela
   ----------------------------------------------------------------------------
   A marca em destaque (a logo SE MONTA toda vez que você entra na aba — a
   mesma entrada da hero do site), o horário e a área de entrega, os dois
   canais de verdade (iFood e Instagram) e as preferências do app.

   Só o que dá pra afirmar: o iFood mostra "abre às 09:30" e não mostra o
   fechamento (LOJA.fecha é null) — então não tem "aberto agora". A entrega
   é "Caetés I e região", como no site. Endereço exato ainda não existe.

   PREFERÊNCIAS: aqui mora o interruptor "Animações" (modo leve,
   ModoLeveContext) — no site ele fica no trilho de vidro. O tema do app
   fica no Início (o botão de sol/lua no topo).
   ========================================================================== */
export default function Loja({ ativa }) {
  const { leve, alternar } = useModoLeve()
  const arroba = LOJA.instagram.split('/').filter(Boolean).pop()

  // cada visita à aba remonta a logo (key nova) e ela se monta de novo
  const [anterior, setAnterior] = useState(ativa)
  const [vezes, setVezes] = useState(0)
  if (ativa !== anterior) {
    setAnterior(ativa)
    if (ativa) setVezes(vezes + 1)
  }

  return (
    <motion.div
      variants={cascata}
      initial="oculto"
      animate="visivel"
      className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[calc(var(--altura-nav)+32px)]"
    >
      <motion.section
        variants={subir}
        className="relative overflow-hidden rounded-[30px] bg-cartao px-6 pt-9 pb-7 text-center shadow-(--sombra-cartao)"
      >
        {/* um sol amarelo-pão atrás da logo */}
        <span
          aria-hidden="true"
          className="absolute top-[-30%] left-1/2 size-[120%] -translate-x-1/2 rounded-full
                     bg-[radial-gradient(closest-side,var(--color-tom-hamburgueres),transparent)] opacity-90"
        />
        <LogoMontando key={vezes} montada cinza={false} className="mx-auto w-[46%] drop-shadow-[0_10px_14px_var(--sombra-burger)]" />
        <h1 className="titulo-app relative mt-6 text-[34px] text-texto">{LOJA.nome}</h1>
        <p className="relative font-script text-[25px] leading-none text-acento">{LOJA.slogan.toLowerCase()}</p>
        <p className="relative mt-2.5 text-[13px] text-texto-suave">
          {LOJA.bairro}, {LOJA.municipio} (PE)
        </p>
      </motion.section>

      <motion.ul variants={subir} className="mt-3 grid grid-cols-2 gap-3">
        <li className="rounded-3xl bg-tom-hamburgueres p-4">
          <Clock size={20} strokeWidth={2.2} className="text-texto" />
          <p className="mt-4 text-[12.5px] font-semibold text-texto/75">Abre às</p>
          <p className="titulo-app text-[30px] text-texto tabular-nums">{LOJA.abre}</p>
        </li>
        <li className="rounded-3xl bg-tom-bebidas p-4">
          <Bike size={20} strokeWidth={2.2} className="text-texto" />
          <p className="mt-4 text-[12.5px] font-semibold text-texto/75">Entrega em</p>
          <p className="titulo-app text-[20px] leading-tight text-texto">{LOJA.bairro} e região</p>
        </li>
      </motion.ul>

      <motion.div variants={subir} className="mt-3 space-y-3">
        <motion.a
          href={LOJA.pedidoExterno}
          target="_blank"
          rel="noreferrer noopener"
          whileTap={{ scale: 0.98 }}
          className="flex h-[58px] items-center justify-between rounded-[22px] bg-botao px-5 text-white shadow-(--sombra-botao)"
        >
          <span className="font-display text-[16px] font-bold">Pedir no iFood</span>
          <ArrowUpRight size={20} strokeWidth={2.4} />
        </motion.a>
        <motion.a
          href={LOJA.instagram}
          target="_blank"
          rel="noreferrer noopener"
          whileTap={{ scale: 0.98 }}
          className="flex h-[58px] items-center gap-3 rounded-[22px] bg-cartao px-5 text-texto shadow-(--sombra-cartao)"
        >
          <IconeInstagram size={20} />
          <span className="text-[15px] font-semibold">@{arroba}</span>
          <ArrowUpRight size={18} strokeWidth={2.2} className="ml-auto text-texto-suave" />
        </motion.a>
      </motion.div>

      <motion.section variants={subir} className="mt-8">
        <h2 className="titulo-app px-1 text-[21px] text-texto">Preferências</h2>
        <div className="mt-3 rounded-3xl bg-cartao p-1.5 shadow-(--sombra-cartao)">
          <button
            type="button"
            role="switch"
            aria-checked={!leve}
            onClick={alternar}
            className="flex w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left transition-colors active:bg-cartao-2"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cartao-2 text-texto">
              <Sparkles size={18} strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-texto">Animações</span>
              <span className="block text-[12.5px] text-texto-suave">
                {leve ? 'Desligadas: o app fica parado e gasta menos bateria' : 'Ligadas'}
              </span>
            </span>
            <Interruptor ligado={!leve} />
          </button>
        </div>
      </motion.section>
    </motion.div>
  )
}

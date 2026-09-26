import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useInView } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   FILEIRA — uma fileira de cartões que rola de lado, e AVISA que rola
   ----------------------------------------------------------------------------
   Usada no Monte seu combo (as três etapas — 5 a 7 opções cada) e no "Pra
   começar" do Início. Só cabem 2 ou 3 cartões na tela, e quem abre o app
   pela primeira vez não sabe que dá pra arrastar. Quatro dicas, todas
   discretas:

     o fundo   uma bandeja no MESMO material do disco da logo na barra
               (.bandeja-fileira no index.css): esbranquiçada no claro,
               escura no escuro. Diz "isto é um grupo que se mexe junto".
     a seta    na direita, no mesmo material. Dá umas cutucadas pro lado
               (4 vezes, depois fica quieta), leva a fileira adiante no
               toque e some quando ela chega ao fim.
     o fade    o último cartão esmaece na borda direita — cortado, ele diz
               "tem mais". Rolou, a borda esquerda esmaece também; no fim,
               a direita volta ao normal (--fade-esq/--fade-dir animam
               sozinhas, ver .rolagem-com-fade).
     a espiada na primeira vez que a fileira aparece na tela, ela desliza
               um pouco pro lado e volta — mostrando que rola. Só uma vez,
               e só se a pessoa ainda não mexeu nela.

   A espiada move um embrulho por dentro (transform), não a rolagem: com
   scroll de verdade, o "snap" dos cartões puxaria a fileira de volta no
   meio do gesto. Com menos movimento, sem espiada e sem cutucadas.

   Props:
     rotulo   o nome da fileira pro leitor de tela ("O lanche", "Pra começar")
     papel    o role da rolagem — "radiogroup" no combo (os cartões são
              rádios); sem papel no Início (os cartões são produtos)
     fadeDireita  largura do esmaecido da borda direita, em px. Ele tem que
              cair no cartão CORTADO, não no último inteiro — senão o "+"
              desse cartão parece desativado. 76 pros cartões de 116px do
              combo; 36 pros de 156px do Início.
   Os cartões (children) precisam de shrink-0 e snap-start.
   ========================================================================== */
export default function Fileira({ rotulo, papel, fadeDireita = 76, children }) {
  const rolagemRef = useRef(null)
  const trilho = useAnimationControls()
  const menos = useMenosMovimento()
  const naTela = useInView(rolagemRef, { once: true, amount: 0.6 })
  // inicio | meio | fim — onde a rolagem está (decide seta e fades)
  const [posicao, setPosicao] = useState('inicio')
  const [mexeu, setMexeu] = useState(false)

  const medir = () => {
    const el = rolagemRef.current
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) setPosicao('fim')
    else setPosicao(el.scrollLeft <= 4 ? 'inicio' : 'meio')
  }

  // mede ao montar e quando a largura muda (girou o celular) — se tudo
  // couber na tela, já nasce "no fim": sem seta, sem fade
  useLayoutEffect(() => {
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(rolagemRef.current)
    return () => observador.disconnect()
  }, [])

  // a espiada, uma vez, quando a fileira entra na tela
  useEffect(() => {
    if (!naTela || menos || mexeu || posicao === 'fim') return
    const id = setTimeout(
      () =>
        trilho.start({
          x: [0, -56, 0],
          transition: { duration: 1.2, times: [0, 0.42, 1], ease: [[0.33, 1, 0.68, 1], [0.65, 0, 0.35, 1]] },
        }),
      260,
    )
    return () => clearTimeout(id)
    // só a primeira vez que ela aparece: as outras dependências não
    // devem reiniciar a espiada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naTela])

  const avancar = () => {
    const el = rolagemRef.current
    el.scrollBy({ left: el.clientWidth * 0.7, behavior: 'smooth' })
    setMexeu(true)
  }

  return (
    <div className="bandeja-fileira relative mx-3 mt-3 overflow-hidden rounded-[26px]">
      <div
        ref={rolagemRef}
        role={papel}
        aria-label={rotulo}
        onScroll={() => {
          medir()
          if (!mexeu) setMexeu(true)
        }}
        className="rolagem-com-fade sem-barra snap-x overflow-x-auto scroll-px-3"
        style={{
          '--fade-esq': posicao === 'inicio' ? '0px' : '28px',
          '--fade-dir': posicao === 'fim' ? '0px' : `${fadeDireita}px`,
        }}
      >
        <motion.div animate={trilho} className="flex w-max gap-2.5 px-3 pt-3 pb-4">
          {children}
        </motion.div>
      </div>

      {/* a seta: só um atalho de toque (o teclado anda pelos cartões com
          Tab, e a rolagem acompanha o foco) — por isso fora da leitura */}
      <AnimatePresence>
        {posicao !== 'fim' && (
          <motion.button
            key="seta"
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={avancar}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 460, damping: 30 }}
            className={`botao-seta absolute top-[calc(50%-22px)] right-2.5 grid size-10 place-items-center rounded-full
                        text-texto ${mexeu ? '' : 'seta-cutucando'}`}
          >
            <ChevronRight size={20} strokeWidth={2.6} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

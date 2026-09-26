import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'
import ArteProduto from '@/app/ArteProduto'

/* ============================================================================
   VOO ATÉ A SACOLA
   ----------------------------------------------------------------------------
   Tocou em "+" (ou em "Adicionar"): o desenho do produto sai do botão, faz
   um arco e cai dentro do ícone da Sacola, lá na barra de baixo — que dá um
   tranco quando ele chega. É o "deu certo" do app (PDF seção 06: toda ação
   tem resposta visual imediata), e ensina ONDE o pedido foi parar.

   O item entra na sacola NA HORA do toque (o voo é só o desenho). Se o
   visitante abrir a sacola no meio do voo, o item já está lá.

   Duas peças:
     voar(elemento, desenho)  quem adiciona chama, passando o botão tocado
     usePulso()               um número que sobe a cada pouso; a Sacola da
                              barra escuta ele pra dar o tranco

   Separados em dois contextos de propósito: quem só chama voar() (todo
   botão "+" do app) não redesenha a cada pouso.

   Sem movimento (sistema ou modo leve): nada voa — o tranco vem na hora.
   ========================================================================== */

const VooContext = createContext(null)
const PulsoContext = createContext(0)

// o desenho que voa: 72px, centralizado no botão tocado
const TAMANHO = 72

export function VooProvider({ children }) {
  const [voos, setVoos] = useState([])
  const [pulso, setPulso] = useState(0)
  const menos = useMenosMovimento()
  const proximoId = useRef(0)

  const voar = useCallback(
    (origem, desenho) => {
      const alvo = document.querySelector('[data-alvo-sacola]')
      if (menos || !origem || !alvo) {
        setPulso((p) => p + 1)
        return
      }

      const de = origem.getBoundingClientRect()
      const para = alvo.getBoundingClientRect()
      // O número do voo é tirado AGORA, numa constante. Ler o
      // proximoId.current dentro do setVoos (como já foi) lia o valor da
      // hora em que o React processa a fila — e dois voos disparados quase
      // juntos (as três peças do combo) saíam com o MESMO número. Chave
      // repetida no React deixava um desenho órfão na tela: a batatinha
      // congelada em cima da Sacola.
      const id = ++proximoId.current
      setVoos((atuais) => [...atuais, { id, de, para, desenho }])
    },
    [menos],
  )

  /* Pousou: tira o desenho e dá o tranco na Sacola. Pode ser chamado duas
     vezes pro mesmo voo (o fim da animação E a rede de segurança do Voo) —
     o `pousados` garante um tranco só. */
  const pousados = useRef(new Set())
  const pousar = useCallback((id) => {
    if (pousados.current.has(id)) return
    pousados.current.add(id)
    setVoos((atuais) => atuais.filter((voo) => voo.id !== id))
    setPulso((p) => p + 1)
  }, [])

  const valor = useMemo(() => ({ voar }), [voar])

  return (
    <VooContext value={valor}>
      <PulsoContext value={pulso}>
        {children}

        {/* acima de tudo, inclusive da folha do item (z 60): o desenho sai
            do botão da folha enquanto ela desce */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70]">
          {voos.map((voo) => (
            <Voo key={voo.id} {...voo} pousar={pousar} />
          ))}
        </div>
      </PulsoContext>
    </VooContext>
  )
}

// duração do voo, em segundos, e a folga da rede de segurança
const DURACAO_VOO = 0.74
const FOLGA_MS = 300

/* O arco: o x anda direto, o y SOBE primeiro e depois cai (dois trechos,
   um desacelerando e outro acelerando — é a curva de uma coisa jogada).
   Encolhe no caminho pra "caber" no ícone, gira um tico e SOME no finzinho
   (opacidade → 0): o desenho entra na sacola, não fica parado em cima dela.

   REDE DE SEGURANÇA: se o fim da animação não avisar (aba em segundo plano
   no meio do voo, uma animação interrompida…), o desenho sai da tela mesmo
   assim, logo depois do tempo do voo. Nenhum desenho fica congelado. */
function Voo({ id, de, para, desenho, pousar }) {
  useEffect(() => {
    const seguranca = setTimeout(() => pousar(id), DURACAO_VOO * 1000 + FOLGA_MS)
    return () => clearTimeout(seguranca)
  }, [id, pousar])

  const x0 = de.left + de.width / 2 - TAMANHO / 2
  const y0 = de.top + de.height / 2 - TAMANHO / 2
  const dx = para.left + para.width / 2 - TAMANHO / 2 - x0
  const dy = para.top + para.height / 2 - TAMANHO / 2 - y0
  // o ponto mais alto: sempre um pouco acima de onde saiu
  const pico = Math.min(-70, dy * -0.15)

  return (
    <motion.div
      className="absolute grid place-items-center drop-shadow-[0_8px_10px_var(--sombra-burger)]"
      style={{ left: x0, top: y0, width: TAMANHO, height: TAMANHO }}
      initial={{ x: 0, y: 0, scale: 0.5, opacity: 0, rotate: 0 }}
      animate={{
        x: [0, dx * 0.4, dx],
        y: [0, pico, dy],
        scale: [0.5, 1.08, 0.3],
        opacity: [0, 1, 1, 0],
        rotate: [0, -12, 10],
      }}
      transition={{
        default: { duration: DURACAO_VOO, times: [0, 0.38, 1], ease: ['easeOut', 'easeIn'] },
        // aparece rápido, fica visível o voo todo e some nos últimos 15%
        opacity: { duration: DURACAO_VOO, times: [0, 0.18, 0.85, 1] },
      }}
      onAnimationComplete={() => pousar(id)}
    >
      <ArteProduto {...desenho} />
    </motion.div>
  )
}

export function useVoo() {
  const contexto = useContext(VooContext)
  if (!contexto) throw new Error('useVoo() precisa estar dentro de <VooProvider>')
  return contexto
}

export const usePulso = () => useContext(PulsoContext)

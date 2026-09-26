import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'
import { LogoMontando } from '@/components/Logo'
import { LOGO } from '@/components/burger/geometria'
import { ABAS, ANCORA_PARA_ABA, abaDoCaminho, indiceDaAba } from '@/app/abas'
import EscritaGiz from '@/app/EscritaGiz'
import { SLOGAN } from '@/app/sloganManuscrito'
import { VooProvider } from '@/app/voo'
import NavInferior from '@/app/NavInferior'
import FolhaItem from '@/app/FolhaItem'
import Inicio from '@/app/telas/Inicio'
import Cardapio from '@/app/telas/Cardapio'
import Combo from '@/app/telas/Combo'
import Sacola from '@/app/telas/Sacola'
import Loja from '@/app/telas/Loja'

/* ============================================================================
   APP DO CELULAR — o esqueleto
   ----------------------------------------------------------------------------
   Celular não vê a landing: vê um app. Cinco abas (abas.js), uma barra
   embaixo (NavInferior), a folha do produto por cima de tudo (FolhaItem) e
   o desenho que voa até a sacola (voo.jsx).

   AS ABAS FICAM MONTADAS
   Num app de verdade, trocar de aba e voltar não apaga nada: a busca
   digitada, a categoria escolhida, o combo montado e a ROLAGEM continuam
   onde estavam. Por isso cada aba, depois da primeira visita, fica montada
   — só escondida (hidden) enquanto outra está na tela. Só a primeira visita
   monta: o app não paga pelas cinco telas logo de cara.

   A rolagem é da PÁGINA (não uma caixa rolando por dentro): é o que deixa
   o navegador do celular recolher a barra de endereço quando você desce.
   Então cada aba guarda a própria posição (posicoes) e, ao voltar pra ela,
   a página rola até lá. Navegar com `state: { topo: true }` (o ladrilho de
   categoria, a busca do Início) começa a aba do topo.

   A TROCA DE ABA DESLIZA pra direção certa: indo pra uma aba à direita na
   barra, a tela nova vem da direita; pra esquerda, da esquerda.

   A ABERTURA (uma vez por carregamento da página), em três fases:
     'logo'   só a logo, se montando grande no meio da tela (a mesma
              montagem da hero do site), e o slogan sendo ESCRITO a giz de
              cera embaixo dela (EscritaGiz.jsx). Nada de barra ainda: é o
              "carregando". A fase acaba quando o giz termina de escrever.
     'barra'  a logo pronta, a barra de abas SOBE por baixo — com o disco
              do meio vazio.
     null     a logo DESCE até o disco (layoutId "logo-app", ver
              NavInferior.jsx), o fundo da abertura some e as telas montam:
              a entrada em cascata do Início acontece enquanto ela voa.
   Um toque adianta uma fase. Com menos movimento, não tem abertura.
   ========================================================================== */

const TELAS = { inicio: Inicio, cardapio: Cardapio, combo: Combo, sacola: Sacola, loja: Loja }

// quanto dura cada fase da abertura. A da logo, na verdade, acaba quando o
// giz termina de escrever o slogan (+ RESPIRO pra ler) — o tempo aqui é só
// a rede de segurança, caso a escrita não avise. A barra leva ~0,4s pra
// subir e assentar antes de a logo descer.
const DURACAO = { logo: 4200, barra: 480 }
const RESPIRO = 320
const PROXIMA = { logo: 'barra', barra: null }
// o giz começa a escrever enquanto o COMBO termina de estourar no meio da
// logo — as duas coisas se emendam em vez de uma esperar a outra
const ATRASO_ESCRITA = 0.55

// Fora do componente de propósito: estado do React morre quando o app
// desmonta (virou tablet e voltou, por exemplo); uma variável de módulo
// vive enquanto a página vive. F5 → abertura de novo; trocar de aba, não.
let aberturaRodou = false

export default function AppCelular() {
  const { pathname, search, hash } = useLocation()
  const ativa = abaDoCaminho(pathname)
  const menos = useMenosMovimento()
  const [fase, setFase] = useState(() => (!aberturaRodou && !menos ? 'logo' : null))
  const [houveAbertura] = useState(fase !== null)
  const [escrito, setEscrito] = useState(false)

  useEffect(() => {
    if (!fase) return
    aberturaRodou = true
    const espera = fase === 'logo' && escrito ? RESPIRO : DURACAO[fase]
    const id = setTimeout(() => setFase(PROXIMA[fase]), espera)
    return () => clearTimeout(id)
  }, [fase, escrito])

  /* O último endereço de cada aba (sem o ?item= da folha). A barra usa
     isto: voltar pro Cardápio devolve você pra categoria em que estava.
     "Ajuste durante o render" (o jeito do React de reagir a uma mudança
     sem um efeito a mais): quando o endereço muda, guarda. */
  const [destinos, setDestinos] = useState(() => Object.fromEntries(ABAS.map((aba) => [aba.id, aba.caminho])))
  const [endereco, setEndereco] = useState(null)
  if (ativa && pathname + search !== endereco) {
    setEndereco(pathname + search)
    const parametros = new URLSearchParams(search)
    parametros.delete('item')
    const resto = parametros.toString()
    const caminho = ABAS[indiceDaAba(ativa)].caminho + (resto ? `?${resto}` : '')
    if (destinos[ativa] !== caminho) setDestinos({ ...destinos, [ativa]: caminho })
  }

  // a rolagem é nossa (Abas guarda uma por aba); a do navegador brigaria
  useEffect(() => {
    const antes = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = antes
    }
  }, [])

  // link do site aberto no celular: /#combo vira a aba Combo
  if (pathname === '/' && ANCORA_PARA_ABA[hash]) return <Navigate to={ANCORA_PARA_ABA[hash]} replace />
  // endereço que não é aba nenhuma: Início
  if (!ativa) return <Navigate to="/" replace />

  return (
    <VooProvider>
      {!fase && <Abas ativa={ativa} />}
      {/* a barra só existe depois do "carregando" (a fase da logo) */}
      {fase !== 'logo' && (
        <NavInferior ativa={ativa} destinos={destinos} logoPousada={!fase} houveAbertura={houveAbertura} />
      )}
      {!fase && <FolhaItem />}
      <Abertura
        visivel={fase !== null}
        aoPular={() => setFase(PROXIMA[fase])}
        aoEscrever={() => setEscrito(true)}
      />
    </VooProvider>
  )
}

/* ---- A ABERTURA ----
   Duas camadas, uma em cima da outra, com a MESMA coluna (logo + slogan):
     fundo  cobre a tela e mostra o slogan; some num fade quando acaba
     logo   só a logo (o slogan aqui é invisível, só pra alinhar)
   A logo mora numa camada própria, sem fade: quando a abertura acaba ela
   desmonta NA HORA e a da barra monta com o mesmo layoutId — é essa troca
   que a Motion anima como um voo. Se ela sumisse junto com o fundo (num
   fade), seriam duas logos na tela ao mesmo tempo.
   O fundo fica ABAIXO da barra (z 30 × 40): na fase 'barra', ela sobe por
   cima dele, e a logo pousa nela já na frente de tudo. */
function Abertura({ visivel, aoPular, aoEscrever }) {
  return (
    <>
      <AnimatePresence>
        {visivel && (
          <motion.div
            key="fundo"
            onClick={aoPular}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-30 grid place-items-center bg-fundo"
          >
            <ColunaAbertura slogan aoEscrever={aoEscrever} />
          </motion.div>
        )}
      </AnimatePresence>

      {visivel && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[31] grid place-items-center">
          <ColunaAbertura logo />
        </div>
      )}
    </>
  )
}

function ColunaAbertura({ logo = false, slogan = false, aoEscrever }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[46vw] max-w-[210px]" style={{ aspectRatio: `100 / ${LOGO.altura}` }}>
        {logo && (
          <motion.div layoutId="logo-app" className="size-full drop-shadow-[0_14px_18px_var(--sombra-burger)]">
            <LogoMontando montada cinza={false} />
          </motion.div>
        )}
      </div>
      {/* o slogan, escrito a giz. Na camada da logo, só o espaço dele
          (mesma caixa), pra as duas colunas ficarem alinhadas */}
      <div className="mt-6 w-[min(52vw,205px)]" style={{ aspectRatio: `${SLOGAN.largura} / ${SLOGAN.altura}` }}>
        {slogan && <EscritaGiz atraso={ATRASO_ESCRITA} aoTerminar={aoEscrever} />}
      </div>
    </div>
  )
}

function Abas({ ativa }) {
  const { state } = useLocation()

  // abas já visitadas (ficam montadas); a primeira não anima a entrada
  const [visitadas, setVisitadas] = useState(() => [ativa])
  if (!visitadas.includes(ativa)) setVisitadas([...visitadas, ativa])
  const [primeira] = useState(ativa)

  // direção da troca: +1 veio da esquerda da barra, -1 da direita
  const [anterior, setAnterior] = useState(ativa)
  const [direcao, setDirecao] = useState(0)
  if (ativa !== anterior) {
    setDirecao(Math.sign(indiceDaAba(ativa) - indiceDaAba(anterior)))
    setAnterior(ativa)
  }

  /* A rolagem de cada aba. O useScroll avisa a cada mudança e a posição
     vai pra aba que está na tela AGORA (ativaRef). Na troca, o layout
     effect abaixo roda antes de o navegador pintar: muda a ativaRef e rola
     até a posição guardada da aba nova — a tela nova já aparece no lugar. */
  const posicoes = useRef({})
  const ativaRef = useRef(ativa)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => {
    posicoes.current[ativaRef.current] = y
  })

  useLayoutEffect(() => {
    if (ativaRef.current === ativa) return
    ativaRef.current = ativa
    window.scrollTo(0, state?.topo ? 0 : (posicoes.current[ativa] ?? 0))
  }, [ativa, state])

  return ABAS.filter((aba) => visitadas.includes(aba.id)).map((aba) => {
    const Tela = TELAS[aba.id]
    const naTela = aba.id === ativa

    return (
      <motion.main
        key={aba.id}
        hidden={!naTela}
        aria-label={aba.rotulo}
        custom={direcao}
        initial={aba.id === primeira ? false : 'fora'}
        animate={naTela ? 'dentro' : 'fora'}
        variants={{
          fora: { opacity: 0, transition: { duration: 0 } },
          // keyframes com ponto de partida explícito: toda vez que a aba
          // volta, ela desliza do lado certo (a direção da troca de agora)
          dentro: (d) => ({
            opacity: [0, 1],
            x: [d * 28, 0],
            transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
          }),
        }}
        className="mx-auto min-h-dvh max-w-[520px]"
      >
        <Tela ativa={naTela} />
      </motion.main>
    )
  })
}

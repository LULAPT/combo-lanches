import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { useCarrinho } from '@/context/CarrinhoContext'
import { LogoMontando } from '@/components/Logo'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'
import { ABAS } from '@/app/abas'
import { usePulso } from '@/app/voo'
import { COMBO_NA_BARRA } from '@/app/animacoes'

// o disco do meio é um Link que também anima (desce e cresce)
const LinkMovel = motion.create(Link)

/* ============================================================================
   BARRA DE ABAS — a navegação do app, presa embaixo
   ----------------------------------------------------------------------------
   Uma pílula flutuante (não encosta nas bordas) com cinco destinos. O
   polegar alcança todos sem esticar — é por isso que app de comida põe a
   navegação embaixo, e não num menu lá em cima.

     Início · Cardápio · [COMBO] · Sacola · Loja

   O DO MEIO É A MARCA: a logo da casa num disco escuro que sobe acima da
   barra (o "entalhe" é um aro da cor do fundo). Leva pro Monte seu combo —
   o nome da loja virou a ação principal. Na abertura do app a logo se
   monta grande no meio da tela e VOA até este disco (AppCelular.jsx); e
   ela se monta de novo (pão de cima cai, o de baixo sobe, o COMBO estoura
   no meio — a entrada da hero do site) toda vez que o Combo vira a aba
   ativa, assim que o disco termina de descer.

   NA ABA COMBO o disco desce, cresce e pousa no MEIO da barra, engolindo
   o rótulo "Combo", e a barra abre pros lados (COMBO_NA_BARRA, em
   animacoes.js). Fora da aba, ele volta pra beirada e o rótulo reaparece.
   Metade pra fora da barra, o disco cobria um pedaço do "Adicionar combo".

   A aba ativa ganha um realce que DESLIZA de uma aba pra outra (layoutId),
   em vez de piscar no lugar novo.

   SACOLA: o contador vermelho, e um tranco quando um produto voa até ela
   (usePulso, voo.jsx). É o único acesso à sacola no app.

   Tocar na aba em que você JÁ está volta pro topo dela (o gesto de todo
   app). Com o teclado aberto (busca do cardápio), a barra desce e sai da
   frente — senão ela ficaria colada em cima do teclado.

   `destinos`: o último endereço de cada aba (AppCelular.jsx). Voltar pro
   Cardápio devolve você pra categoria em que estava, não pro começo.
   ========================================================================== */
/* `logoPousada`: a logo já está no disco do meio. Na abertura do app a
   barra aparece ANTES (vazia) e a logo desce até ela logo depois.
   `houveAbertura`: a barra nasce subindo de baixo (só depois da abertura;
   nas outras vezes que o app monta, ela já nasce no lugar). */
export default function NavInferior({ ativa, destinos, logoPousada = true, houveAbertura = false }) {
  const teclado = useTecladoAberto()
  const menos = useMenosMovimento()
  const abre = ativa === 'combo' ? -COMBO_NA_BARRA.abre : 0

  return (
    <motion.nav
      aria-label="Navegação"
      initial={false}
      animate={{ y: teclado ? '140%' : '0%' }}
      transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      {/* A caixa de fora centraliza; a barra, dentro dela, abre pros lados
          com margem NEGATIVA (as duas por igual, então continua no meio).
          Mexer na margem é mexer no layout, mas é só a barra: é fixa, e o
          resto da página nem fica sabendo. */}
      <div className="mx-auto max-w-[480px]">
        {/* depois da abertura, a barra SOBE de baixo (mola firme: ela
            precisa assentar antes de a logo descer até o disco) */}
        <motion.div
          initial={houveAbertura ? { y: 120, opacity: 0, marginLeft: abre, marginRight: abre } : false}
          animate={{ y: 0, opacity: 1, marginLeft: abre, marginRight: abre }}
          transition={{
            type: 'spring',
            stiffness: 340,
            damping: 32,
            marginLeft: menos ? { duration: 0 } : COMBO_NA_BARRA.mola,
            marginRight: menos ? { duration: 0 } : COMBO_NA_BARRA.mola,
          }}
          className="pointer-events-auto relative grid h-[68px] grid-cols-5 rounded-[26px] border border-linha/70
                     bg-cartao/90 shadow-(--sombra-nav) backdrop-blur-xl"
        >
          {ABAS.map((aba) =>
            aba.centro ? (
              <BotaoCentro
                key={aba.id}
                aba={aba}
                ativo={ativa === aba.id}
                para={destinos[aba.id]}
                logoPousada={logoPousada}
                houveAbertura={houveAbertura}
              />
            ) : (
              <ItemAba key={aba.id} aba={aba} ativo={ativa === aba.id} para={destinos[aba.id]} />
            ),
          )}
        </motion.div>
      </div>
    </motion.nav>
  )
}

// na aba em que você já está: não navega, sobe pro topo
const topoSeAtiva = (ativo) => (e) => {
  if (!ativo) return
  e.preventDefault()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function ItemAba({ aba, ativo, para }) {
  const { Icone } = aba
  const sacola = aba.id === 'sacola'
  const cor = ativo ? 'text-acento' : 'text-texto-suave'

  return (
    <Link
      to={para}
      onClick={topoSeAtiva(ativo)}
      aria-current={ativo ? 'page' : undefined}
      className="relative flex flex-col items-center justify-center gap-1 rounded-[22px] -outline-offset-4"
    >
      <span className="relative grid h-8 w-14 place-items-center">
        {ativo && (
          <motion.span
            layoutId="aba-realce"
            transition={{ type: 'spring', stiffness: 520, damping: 40 }}
            className="absolute inset-0 rounded-full bg-acento/12"
          />
        )}
        {sacola ? (
          <IconeSacola className={cor} ativo={ativo} />
        ) : (
          <Icone size={21} strokeWidth={ativo ? 2.4 : 2} className={`relative transition-colors ${cor}`} />
        )}
      </span>
      <span className={`text-[10.5px] font-semibold transition-colors ${cor}`}>
        {aba.rotulo}
        {sacola && <ContagemFalada />}
      </span>
    </Link>
  )
}

/* A sacola: contador + tranco. data-alvo-sacola é onde o desenho que voa
   (voo.jsx) mira. */
function IconeSacola({ ativo, className }) {
  const { quantidadeTotal } = useCarrinho()
  const pulso = usePulso()
  const controles = useAnimationControls()

  useEffect(() => {
    if (!pulso) return
    controles.start({
      scale: [1, 1.3, 0.9, 1],
      rotate: [0, -10, 6, 0],
      transition: { duration: 0.5, ease: 'easeOut' },
    })
  }, [pulso, controles])

  return (
    <motion.span data-alvo-sacola animate={controles} className="relative grid place-items-center">
      <ShoppingBag size={21} strokeWidth={ativo ? 2.4 : 2} className={`transition-colors ${className}`} />

      <AnimatePresence>
        {quantidadeTotal > 0 && (
          <motion.span
            aria-hidden="true"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 24 }}
            className="absolute -top-2 -right-3 grid h-[18px] min-w-[18px] place-items-center overflow-hidden rounded-full
                       bg-botao px-1 text-[10px] font-bold text-white ring-2 ring-cartao tabular-nums"
          >
            {/* o número troca deslizando, nunca piscando (PDF seção 06) */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={quantidadeTotal}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {quantidadeTotal > 99 ? '99+' : quantidadeTotal}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  )
}

// o contador é desenho (aria-hidden); o leitor de tela ouve "Sacola, 3 itens"
function ContagemFalada() {
  const { quantidadeTotal } = useCarrinho()
  if (!quantidadeTotal) return null
  return <span className="sr-only">, {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'}</span>
}

/* ---- O BOTÃO DO MEIO ----
   Fora do Combo, o disco mora na BEIRADA de cima da barra, metade pra
   fora, com o rótulo "Combo" embaixo. No Combo, ele DESCE (o centro dele
   vai de 5px abaixo da borda de cima pro meio da barra: 28px) e CRESCE
   (1.16: de 62 pra ~72px, um tico mais alto que a barra — assenta nela
   como uma moeda), engolindo o rótulo, que encolhe e sobe pra dentro dele.
   Tudo por transform (y e scale): a logo cresce junto.
   O aro da cor do fundo (o "entalhe", .disco-marca no index.css) some no
   meio: ele só faz sentido cortando a borda da barra. */
const DESCE = 28
const CRESCE = 1.16

function BotaoCentro({ aba, ativo, para, logoPousada, houveAbertura }) {
  const menos = useMenosMovimento()
  /* Cada vez que o Combo vira a aba ativa, a logo remonta (key nova) e se
     monta de novo — mas só QUANDO O DISCO CHEGA no meio da barra: ele desce
     com a logo parada, já montada, e ela se desmonta e remonta lá embaixo.
     Pedido do Marco. "Chegar" é o visualDuration da mola (o quique que vem
     depois não conta).
     Duas etapas: o "ajuste durante o render" (anterior/entradas) percebe
     que o Combo virou a aba ativa — é o jeito do React de reagir a uma prop
     que mudou sem um efeito a mais; o efeito espera o disco e só então
     troca a key (vezes). Saindo antes de ele chegar, o efeito cancela. */
  const [anterior, setAnterior] = useState(ativo)
  const [entradas, setEntradas] = useState(0)
  const [vezes, setVezes] = useState(0)
  if (ativo !== anterior) {
    setAnterior(ativo)
    if (ativo) setEntradas(entradas + 1)
  }

  useEffect(() => {
    if (!ativo || entradas === vezes) return
    const id = setTimeout(() => setVezes(entradas), menos ? 0 : COMBO_NA_BARRA.mola.visualDuration * 1000)
    return () => clearTimeout(id)
  }, [ativo, entradas, vezes, menos])

  return (
    <div className="relative flex flex-col items-center justify-end pb-[10px]">
      <LinkMovel
        to={para}
        onClick={topoSeAtiva(ativo)}
        aria-current={ativo ? 'page' : undefined}
        aria-label="Monte seu combo"
        // abrindo o app já no Combo, o disco nasce no meio (sem viagem)
        initial={false}
        animate={ativo ? { y: DESCE, scale: CRESCE } : { y: 0, scale: 1 }}
        transition={menos ? { duration: 0 } : COMBO_NA_BARRA.mola}
        data-no-meio={ativo || undefined}
        // as cores do disco mudam com o tema (.disco-marca, index.css):
        // escuro no escuro, esbranquiçado com contorno no claro. O
        // -translate-x-1/2 (a propriedade translate) não briga com o y e o
        // scale da Motion (a propriedade transform): uma soma com a outra.
        className="disco-marca absolute -top-[26px] left-1/2 grid size-[62px] -translate-x-1/2 place-items-center
                   rounded-full"
      >
        {/* Na abertura o disco começa vazio: a logo está no meio da
            tela. Quando a barra assenta, ela VOA até aqui:
            as duas têm o mesmo layoutId ("logo-app"), e a Motion anima de
            uma posição (e tamanho) pra outra. Chegando voando, ela já vem
            montada (desdeFora false); das próximas vezes que o Combo vira a
            aba ativa, ela se monta de novo quando o disco chega. */}
        {logoPousada && (
          <motion.span
            layoutId="logo-app"
            transition={{ layout: { type: 'spring', stiffness: 150, damping: 20 } }}
            whileTap={{ scale: 0.86 }}
            // centro ÓTICO, não o da régua: no meio exato do disco a logo
            // parecia puxada pra baixo (o COMBO e o pão de baixo, com a
            // sombra, pesam embaixo). O mb-1 a sobe: o disco centraliza a
            // caixa da logo MAIS a margem, então ela fica 2px acima do meio.
            // Ajuste fino é aqui: mb-0.5 sobe 1px, mb-2 sobe 4px.
            className="mb-1 block w-[44px] drop-shadow-[0_2px_2px_var(--sombra-burger)]"
          >
            <LogoMontando key={vezes} montada cinza={false} desdeFora={vezes > 0 || !houveAbertura} />
          </motion.span>
        )}
      </LinkMovel>
      {/* o rótulo: no Combo, encolhe e sobe pra dentro do disco (rápido,
          antes de o disco chegar em cima dele); saindo do Combo, espera o
          disco começar a subir e só então sai de baixo dele, com quique */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={ativo ? { y: -14, scale: 0.3, opacity: 0 } : { y: 0, scale: 1, opacity: 1 }}
        transition={
          menos
            ? { duration: 0 }
            : ativo
              ? { duration: 0.2, ease: [0.55, 0, 1, 0.45] }
              : { type: 'spring', visualDuration: 0.35, bounce: 0.4, delay: 0.12 }
        }
        className={`text-[10.5px] font-semibold transition-colors ${ativo ? 'text-acento' : 'text-texto-suave'}`}
      >
        {aba.rotulo}
      </motion.span>
    </div>
  )
}

/* Teclado aberto = algum campo de texto está com o foco. (Esperar o
   visualViewport encolher também funcionaria, mas chega atrasado: a barra
   apareceria em cima do teclado por um instante.) */
function useTecladoAberto() {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const ehCampo = (el) =>
      el instanceof HTMLElement &&
      el.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, select')

    const entrou = (e) => ehCampo(e.target) && setAberto(true)
    const saiu = (e) => ehCampo(e.target) && setAberto(false)

    document.addEventListener('focusin', entrou)
    document.addEventListener('focusout', saiu)
    return () => {
      document.removeEventListener('focusin', entrou)
      document.removeEventListener('focusout', saiu)
    }
  }, [])

  return aberto
}

import { UtensilsCrossed } from 'lucide-react'
import MiniBurger from '@/components/burger/MiniBurger'
import {
  Bolo,
  CopoSuco,
  Coxinha,
  Fritas,
  Garrafa,
  Garrafinha,
  Lata,
  MiniPizza,
  Pet,
} from '@/components/burger/ilustracoes'

/* ============================================================================
   ILUSTRAÇÃO DE PRODUTO — o substituto dos emojis
   ----------------------------------------------------------------------------
   Todo lugar que mostra um produto (card do cardápio, modal, sacola, bandeja
   do combo) passa por aqui. Hambúrguer vira o MiniBurger desenhado com as
   camadas dele; o resto vira o desenho do mapa abaixo.

   Quando chegarem fotos dos produtos: troque a entrada no mapa por
   `(c) => <img src="/produtos/coxinha.png" alt="" className={c} />`
   e todos os lugares que mostram a coxinha mudam juntos.

   ESCALA: altura relativa de cada produto, em % da vitrine. É o que faz a
   prateleira do cardápio fazer sentido — a lata é baixinha, a garrafa de 2L
   é a mais alta, e todos pousam na mesma "linha do balcão".
   ========================================================================== */

// cores genéricas de sabor — sem marca
const COR = {
  cola: '#d9241c',
  pepsi: '#1f4fb5',
  guarana: '#1b7f3b',
  laranja: '#f5821f',
  limao: '#b9cf2e',
}
const LIQUIDO = {
  cola: '#3a170b',
  guarana: '#a8561a',
  laranja: '#ff8a00',
  limao: '#dfe9a8',
}

const DESENHOS = {
  'batata-350': (c) => <Fritas className={c} />,
  'batata-completa': (c) => <Fritas completa className={c} />,
  coxinha: (c) => <Coxinha className={c} />,
  'mini-pizza': (c) => <MiniPizza className={c} />,
  'fatia-bolo': (c) => <Bolo className={c} />,

  agua: (c) => <Garrafa className={c} />,
  'agua-gas': (c) => <Garrafa gas className={c} />,
  suco: (c) => <CopoSuco className={c} />,
  h2o: (c) => <Pet litros={0.5} cor={COR.limao} liquido={LIQUIDO.limao} className={c} />,

  'antarctica-200': (c) => <Garrafinha cor={COR.guarana} liquido={LIQUIDO.guarana} className={c} />,
  'pepsi-200': (c) => <Garrafinha cor={COR.pepsi} liquido={LIQUIDO.cola} className={c} />,
  'coca-200': (c) => <Garrafinha cor={COR.cola} liquido={LIQUIDO.cola} className={c} />,

  'coca-lata': (c) => <Lata cor={COR.cola} className={c} />,
  'fanta-lata': (c) => <Lata cor={COR.laranja} className={c} />,
  'antarctica-350': (c) => <Lata cor={COR.guarana} faixa="#ffd84a" className={c} />,

  'coca-1l': (c) => <Pet cor={COR.cola} liquido={LIQUIDO.cola} className={c} />,
  'fanta-1l': (c) => <Pet cor={COR.laranja} liquido={LIQUIDO.laranja} className={c} />,
  'antarctica-1l': (c) => <Pet cor={COR.guarana} liquido={LIQUIDO.guarana} className={c} />,
  'pepsi-1l': (c) => <Pet cor={COR.pepsi} liquido={LIQUIDO.cola} className={c} />,
  'coca-pet-1l': (c) => <Pet cor={COR.cola} liquido={LIQUIDO.cola} tampa="#b31b14" className={c} />,

  'antarctica-2l': (c) => <Pet litros={2} cor={COR.guarana} liquido={LIQUIDO.guarana} className={c} />,
  'fanta-2l': (c) => <Pet litros={2} cor={COR.laranja} liquido={LIQUIDO.laranja} className={c} />,
  'pepsi-2l': (c) => <Pet litros={2} cor={COR.pepsi} liquido={LIQUIDO.cola} className={c} />,
  'coca-2l': (c) => <Pet litros={2} cor={COR.cola} liquido={LIQUIDO.cola} className={c} />,
}

/* Altura na vitrine, em % (quanto maior o produto de verdade, mais alto). */
const ESCALA = {
  'batata-350': 74,
  'batata-completa': 76,
  coxinha: 62,
  'mini-pizza': 44,
  'fatia-bolo': 52,
  agua: 70,
  'agua-gas': 70,
  suco: 62,
  h2o: 64,
  'antarctica-200': 60,
  'pepsi-200': 60,
  'coca-200': 60,
  'coca-lata': 56,
  'fanta-lata': 56,
  'antarctica-350': 56,
  'coca-1l': 78,
  'fanta-1l': 78,
  'antarctica-1l': 78,
  'pepsi-1l': 78,
  'coca-pet-1l': 78,
  'antarctica-2l': 90,
  'fanta-2l': 90,
  'pepsi-2l': 90,
  'coca-2l': 90,
}

export const escalaDe = (id) => ESCALA[id] ?? 66

const PADRAO = 'block w-full overflow-visible'

// `justo`: repassado pro MiniBurger (miniatura sem espaço de abrir — a sacola)
export default function Ilustracao({ item, itemId, camadas, aberto = false, justo = false, className = PADRAO }) {
  const id = item?.id ?? itemId
  const pilha = camadas ?? item?.camadas

  if (pilha) return <MiniBurger camadas={pilha} aberto={aberto} justo={justo} />

  const desenhar = DESENHOS[id]
  if (desenhar) return desenhar(className)

  // item novo sem desenho ainda: um ícone neutro em vez de buraco na tela
  return (
    <span className="grid size-full place-items-center text-texto-suave">
      <UtensilsCrossed size={28} />
    </span>
  )
}

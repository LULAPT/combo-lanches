import { useId } from 'react'
import { CAMADAS } from './camadas'
import { LOGO } from './geometria'
import { PalavraCombo, PaoBase, PaoTopo } from './pecasLogo'

const PECAS_LOGO = { topo: PaoTopo, combo: PalavraCombo, base: PaoBase }

/* ============================================================================
   CAMADA — desenha UMA peça do burger
   ----------------------------------------------------------------------------
   Serve tanto pras peças da logo (pão de cima, COMBO, pão de baixo — SVG
   do pecasLogo.jsx) quanto pros recheios (SVG do camadas.jsx). Quem usa não
   precisa saber qual é qual: <Camada tipo="bacon" /> e <Camada tipo="topo" />
   funcionam igual.

   POR QUE O useId
   Cada SVG define um degradê com um id, e o preenchimento aponta pra ele
   (`fill="url(#id)"`). Ids no HTML são globais: com dez burgers na tela e
   todos usando id="degrade", todos pintariam com o degradê do PRIMEIRO. O
   useId dá um id único por instância.

   O replace tira caracteres que o React põe no id (tipo «r3» ou :r3:) e
   que, dentro de url(#...), alguns navegadores não resolvem.
   ========================================================================== */
export default function Camada({ tipo, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  if (tipo in LOGO) {
    const Peca = PECAS_LOGO[tipo]
    return <Peca className={`block w-full overflow-visible ${className}`} />
  }

  const camada = CAMADAS[tipo]
  if (!camada) return null

  const degrade = (cores, sufixo) => (
    <linearGradient id={id + sufixo} x1="0" y1="0" x2="0" y2="1">
      {cores.map((cor, i) => (
        <stop key={i} offset={i / (cores.length - 1)} stopColor={cor} />
      ))}
    </linearGradient>
  )

  return (
    <svg
      viewBox={`0 0 400 ${camada.vb}`}
      aria-hidden="true"
      className={`block w-full overflow-visible ${className}`}
    >
      <defs>
        {degrade(camada.cores, 'a')}
        {camada.cores2 && degrade(camada.cores2, 'b')}
      </defs>
      {camada.desenhar(`url(#${id}a)`, `url(#${id}b)`)}
    </svg>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

/* ============================================================================
   GRIFO — o marca-texto que passa sozinho (o mark.ink do Lidera360)
   ----------------------------------------------------------------------------
   Pra trechos que valem a leitura. A caneta NÃO passa quando o texto entra
   na tela: passa depois que o bloco terminou de SURGIR — senão o traço
   competiria com o surgimento, os dois se mexendo ao mesmo tempo.

     <Grifo>fecha pelo iFood</Grifo>
         espera entrar na tela + o surgimento do <Revelar> (800ms) + um
         respiro (160ms). `atraso` soma mais — pra quem está no meio de
         um RevelarGrupo e só surge 90ms depois do irmão.

     <Grifo ligado={terminou}>Role a página</Grifo>
         quem avisa é o componente de fora (a hero avisa quando a
         digitação acaba). Aí conta só o respiro.

   O visual e a transição estão no index.css (bloco MARCA-TEXTO).
   ========================================================================== */

const SURGIMENTO = 800 // ms — a DURACAO do Revelar.jsx
const RESPIRO = 160 // ms entre o fim do surgimento e a caneta

export default function Grifo({ children, ligado, atraso = 0 }) {
  const ref = useRef(null)
  // margem de baixo negativa: conta como "na tela" um pouco depois de a
  // borda aparecer, igual ao Revelar
  const naTela = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
  const [grifado, setGrifado] = useState(false)

  const controlado = ligado !== undefined
  const pronto = controlado ? ligado : naTela

  useEffect(() => {
    if (!pronto || grifado) return
    const espera = (controlado ? 0 : SURGIMENTO) + RESPIRO + atraso
    const id = setTimeout(() => setGrifado(true), espera)
    return () => clearTimeout(id)
  }, [pronto, grifado, controlado, atraso])

  return (
    <mark ref={ref} data-grifado={grifado} className="grifo">
      {children}
    </mark>
  )
}

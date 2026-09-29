import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

/* ============================================================================
   NOTA GRIFADA — o marca-texto passando sozinho nas notas manuscritas do app
   ----------------------------------------------------------------------------
   A caneta do site (o Grifo do desktop, o mark.ink do Lidera360) nos textos
   em letra manuscrita (Caveat) do app: "boa noite!", "tá a fim de quê?",
   "turbine do seu jeito"… Pedido do Marco: automático, com um atraso, e só
   quando o texto CHEGA na tela — o "boa noite!" já aparece grifado; o "tá a
   fim de quê?", lá embaixo, só quando a rolagem chegar nele.

   Diferente do Grifo do site, a letra NÃO muda de cor: as notas do app são
   vermelhas (a cor da casa) e continuam vermelhas, com o traço vermelho
   translúcido por trás (tom sobre tom — contraste ~3,7:1 no claro e ~4:1 no
   escuro, o bastante pra letra de 17px pra cima).

   O visual e a transição estão no index.css (.grifo-nota). Com menos
   movimento, a regra global zera a transição: o traço aparece pronto.

   `margem`: o gatilho só dispara quando o texto passa da barra de abas
   (fixa em cima da parte de baixo da tela) — senão a caneta passaria
   escondida atrás dela.
   ========================================================================== */

const ESPERA = 450 // ms entre o texto chegar na tela e a caneta começar

/* O "à mão" de cada traço, sorteado UMA vez por nota (useState com função:
   o sorteio não se repete a cada render, senão o traço tremeria).
   Bem de leve: 0,8° a 2,2°, pra cima ou pra baixo, e até 1,5px de desvio
   vertical — o suficiente pra um não ser igual ao outro. */
function sortearTraco() {
  const sinal = Math.random() < 0.5 ? -1 : 1
  return {
    '--inclina': `${(sinal * (0.8 + Math.random() * 1.4)).toFixed(2)}deg`,
    '--desvio': `${((Math.random() * 2 - 1) * 1.5).toFixed(2)}px`,
  }
}

export default function NotaGrifada({ children, atraso = 0 }) {
  const ref = useRef(null)
  const naTela = useInView(ref, { once: true, margin: '0px 0px -110px 0px' })
  const [grifado, setGrifado] = useState(false)
  const [traco] = useState(sortearTraco)

  useEffect(() => {
    if (!naTela || grifado) return
    const id = setTimeout(() => setGrifado(true), ESPERA + atraso)
    return () => clearTimeout(id)
  }, [naTela, grifado, atraso])

  return (
    <mark ref={ref} data-grifado={grifado} className="grifo-nota" style={traco}>
      {children}
    </mark>
  )
}

import { useCallback, useEffect, useRef } from 'react'

/* ============================================================================
   useProximidade — a lista do trilho "acorda" conforme o mouse passa
   ----------------------------------------------------------------------------
   Adaptação do LineSidebar do ReactBits (a ideia é dele; o código foi
   reescrito pra caber no trilho). Dois tipos de peça, dois jeitos de reagir:

   ITEM     (a linha inteira: barra grande, número, texto) só acende com o
            mouse EM CIMA dele. Variável CSS: --efeito, 0 ou 1.
   TRACINHO (as barrinhas entre os itens) acende por PROXIMIDADE: quanto
            mais perto do mouse, mais aceso. Variável CSS: --perto, de 0 a 1.
            Com o mouse num item, os dois tracinhos colados nele (o de cima e
            o de baixo) são os que mais acendem.

   Esse era o pedido: minimalista. As barras grandes ficam quietas; quem
   "sente" o mouse chegando são só os tracinhos.

   Um laço de requestAnimationFrame persegue o alvo de cada peça com
   suavização exponencial — o mesmo "persegue o alvo" do <Preco>. Até o
   0/1 do item vira uma transição macia, sem estalo.

   DUAS CORREÇÕES EM RELAÇÃO AO ORIGINAL
   1. O original reiniciava o laço a CADA movimento do mouse, zerando o
      relógio. Como o evento de mouse chega no mesmo quadro que o laço roda,
      o tempo entre os dois dava ~0 (às vezes negativo): enquanto o mouse
      se mexia, o efeito quase não andava, e só "pulava" pro lugar quando o
      mouse parava. Aqui o laço, se já está rodando, só recebe os alvos
      novos — o relógio segue o dos quadros.
   2. O original media só a distância VERTICAL. Com o mouse bem longe, de
      lado, mas na altura de um item, o item acendia. Aqui conta também a
      distância horizontal até a linha.
   ========================================================================== */

// curva "smooth" do original: começa e termina devagar
const CURVA = (p) => p * p * (3 - 2 * p)

// o vão entre dois itens tem 6px: cada item "pega" metade dele, pra não
// existir faixa morta entre um e outro (a barra apagaria no meio do caminho)
const MEIO_VAO = 3

const VARIAVEL = { item: '--efeito', tique: '--perto' }
const TIPOS = Object.keys(VARIAVEL)

export function useProximidade({ raio = 80, suavidade = 100 } = {}) {
  // por tipo: os elementos, onde cada um quer chegar e onde está agora
  const pecas = useRef({ item: [], tique: [] })
  const alvos = useRef({ item: [], tique: [] })
  const atuais = useRef({ item: [], tique: [] })
  const quadro = useRef(null)
  const ultimo = useRef(0)
  // o laço lê a suavidade sem precisar ser recriado a cada render
  const suavidadeRef = useRef(suavidade)

  const animar = useCallback(() => {
    if (quadro.current != null) return // já rodando: só os alvos mudaram
    ultimo.current = performance.now()

    const passo = (agora) => {
      // dt entre 0 e 50ms: nunca negativo, e uma aba que ficou parada não
      // faz tudo pular de uma vez quando volta
      const dt = Math.min(Math.max((agora - ultimo.current) / 1000, 0), 0.05)
      ultimo.current = agora
      // quanto do caminho andar neste quadro — independe da taxa de quadros
      const k = 1 - Math.exp(-dt / (Math.max(suavidadeRef.current, 1) / 1000))

      let mexendo = false
      for (const tipo of TIPOS) {
        pecas.current[tipo].forEach((el, i) => {
          if (!el) return
          const alvo = alvos.current[tipo][i] || 0
          const atual = atuais.current[tipo][i] || 0
          let valor = atual + (alvo - atual) * k
          if (Math.abs(alvo - valor) < 0.002) valor = alvo
          else mexendo = true
          atuais.current[tipo][i] = valor
          el.style.setProperty(VARIAVEL[tipo], valor.toFixed(4))
        })
      }

      quadro.current = mexendo ? requestAnimationFrame(passo) : null
    }

    quadro.current = requestAnimationFrame(passo)
  }, [])

  const aoMover = useCallback(
    (e) => {
      const x = e.clientX
      const y = e.clientY

      // ITEM: 1 com o mouse dentro da caixa (mais meio vão), 0 fora
      pecas.current.item.forEach((el, i) => {
        if (!el) return
        const c = el.getBoundingClientRect()
        const dentro =
          x >= c.left && x <= c.right && y >= c.top - MEIO_VAO && y <= c.bottom + MEIO_VAO
        alvos.current.item[i] = dentro ? 1 : 0
      })

      // TRACINHO: vertical até ele; horizontal até a LINHA dele (o tracinho
      // é pequenininho, na ponta esquerda — medir até ele mesmo faria o mouse
      // em cima do texto parecer "longe")
      pecas.current.tique.forEach((el, i) => {
        if (!el) return
        const t = el.getBoundingClientRect()
        const linha = el.closest('a')?.getBoundingClientRect() ?? t
        const dx = Math.max(linha.left - x, 0, x - linha.right)
        const dy = Math.abs(y - (t.top + t.height / 2))
        alvos.current.tique[i] = CURVA(Math.max(0, 1 - Math.hypot(dx, dy) / raio))
      })

      animar()
    },
    [raio, animar],
  )

  const aoSair = useCallback(() => {
    for (const tipo of TIPOS) alvos.current[tipo] = alvos.current[tipo].map(() => 0)
    animar()
  }, [animar])

  useEffect(() => {
    suavidadeRef.current = suavidade
  }, [suavidade])

  /* Desmontou: para o laço E esquece o quadro. Esquecer é a parte que
     importa — o `animar` acima só começa um laço novo quando quadro.current
     está vazio. O StrictMode (main.jsx) monta, desmonta e monta de novo
     todo componente em desenvolvimento; sem o `= null`, depois dessa
     remontagem o hook achava que ainda tinha um laço rodando, nunca
     começava outro, e a lista ficava estática. */
  useEffect(
    () => () => {
      if (quadro.current != null) cancelAnimationFrame(quadro.current)
      quadro.current = null
    },
    [],
  )

  // refs: <a ref={registrarItem(0)}> e <span ref={registrarTique(0)}>
  const registrarItem = useCallback((i) => (el) => {
    pecas.current.item[i] = el
  }, [])
  const registrarTique = useCallback((i) => (el) => {
    pecas.current.tique[i] = el
  }, [])

  return { registrarItem, registrarTique, aoMover, aoSair }
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   ÁRVORE DOS BURGERS — o gráfico que liga os cinco da casa
   ----------------------------------------------------------------------------
   O desenho que você fez no Paint: um tronco descendo pelo meio do
   zigue-zague, e de cada nó sai um galho em curva que termina numa seta
   apontando pro burger daquela linha — pra esquerda, pra direita, pra
   esquerda...

   Começa numa cor neutra, sem destaque. Conforme a página rola, uma "tinta"
   vermelha desce pelo tronco e, quando chega num nó, escorre pelo galho até
   a seta. A tinta vai até a LINHA DE LEITURA — uma linha imaginária a 62%
   da altura da tela: o que já passou por ela está pintado, o que não passou
   ainda está cinza. Rolou pra cima, a tinta volta junto.

   O TRONCO ONDULA SOZINHO: ele passa pelo meio do vão entre burger e texto
   de cada linha, e as linhas do zigue-zague são deslocadas 3% pra um lado e
   pro outro (a "cascata"). Ligando esses pontos com curvas, sai o tronco
   torto do desenho.

   MEDIDO, NÃO CHUTADO: a posição de cada burger vem do layout real
   (offsetTop/offsetLeft — que ignoram as animações de entrada, então a
   árvore mira onde o burger VAI parar, não onde ele está voando). Um
   ResizeObserver refaz tudo quando a lista muda de tamanho.

   COMO A TINTA ANDA: cada caminho pintado tem pathLength="1" e um tracejado
   de tamanho 1 (index.css, bloco ÁRVORE). O stroke-dashoffset vai de 1
   (nada) a 0 (tudo) — é o mesmo truque do "verdade." que se desenha. Quem
   escreve o valor é o scroll, direto no DOM, sem render do React.
   ========================================================================== */

const QUEDA = 64 // quanto o galho desce do nó até a altura do meio do burger
const FOLGA_PONTA = 8 // a seta para antes da caixa do burger
const ACIMA = 90 // o tronco começa este tanto acima do primeiro nó
const ABAIXO = 70 // e termina este tanto abaixo da última seta
const LINHA_DE_LEITURA = 0.62 // fração da altura da tela até onde a tinta chega

const limitar = (v) => Math.min(Math.max(v, 0), 1)

// comprimento de uma curva cúbica, somando 32 pedacinhos retos
function comprimento(a, c1, c2, b) {
  let total = 0
  let x0 = a.x
  let y0 = a.y
  for (let i = 1; i <= 32; i++) {
    const t = i / 32
    const u = 1 - t
    const x = u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x
    const y = u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y
    total += Math.hypot(x - x0, y - y0)
    x0 = x
    y0 = y
  }
  return total
}

/* Onde a seção estaria na tela se não fosse sticky: o topo da .pilha mais a
   altura de todas as irmãs antes dela (a mesma conta do RolagemDeRota e do
   useSecaoAtiva). */
function topoSemSticky(secao) {
  const pilha = secao.parentElement
  let topo = pilha.getBoundingClientRect().top
  for (const irma of pilha.children) {
    if (irma === secao) break
    topo += irma.offsetHeight
  }
  return topo
}

// pinta uma fração v (0 a 1) de um caminho com pathLength="1"
function tingir(el, v) {
  if (!el) return
  el.style.strokeDashoffset = String(1 - v)
  // sem isto, a ponta redonda de um traço de tamanho zero vira um pontinho
  el.style.opacity = v > 0.001 ? '1' : '0'
}

export default function ArvoreBurgers({ listaRef }) {
  const [arvore, setArvore] = useState(null)
  const arvoreRef = useRef(null)
  const troncoRef = useRef(null)
  const galhosRef = useRef([])
  const setasRef = useRef([])
  const nosRef = useRef([])
  const reduzido = useMenosMovimento()
  const { scrollY } = useScroll()

  /* ---- MEDIR: onde cada linha do zigue-zague está ----
     useEffect, não useLayoutEffect: a árvore vem ANTES da lista na página,
     e o React liga as refs na ordem da página — no momento do layout
     effect daqui, a ref da lista ainda estaria vazia. O useEffect roda
     depois de tudo montado. */
  useEffect(() => {
    const lista = listaRef.current
    if (!lista) return

    const medir = () => {
      const linhas = [...lista.children]
      if (!lista.offsetWidth || !linhas.length) return // escondida (celular)

      const ramos = linhas.map((li, i) => {
        const burger = li.querySelector('[data-arvore="burger"]')
        const invertida = i % 2 === 1
        const largura = li.offsetWidth
        // o meio do vão, com o deslocamento de 3% da cascata (Burgers.jsx)
        const centro = li.offsetLeft + largura / 2 + (invertida ? -0.03 : 0.03) * largura
        const vao = parseFloat(getComputedStyle(li).columnGap) || 0
        const meio = li.offsetTop + burger.offsetTop + burger.offsetHeight / 2
        // linha par: burger à esquerda do vão; ímpar: à direita
        const lado = invertida ? 1 : -1

        const no = { x: centro, y: meio - QUEDA }
        const ponta = { x: centro + lado * (vao / 2 - FOLGA_PONTA), y: meio }
        const dx = ponta.x - no.x
        const dy = ponta.y - no.y

        return {
          no,
          ponta,
          // sai do tronco descendo (tangente vertical) e entra no burger na
          // horizontal: o "cotovelo" dos galhos do desenho
          galho: `M${no.x} ${no.y}C${no.x} ${no.y + dy * 0.55} ${ponta.x - dx * 0.55} ${ponta.y} ${ponta.x} ${ponta.y}`,
          seta: `M${ponta.x - lado * 7} ${ponta.y - 5}L${ponta.x} ${ponta.y}L${ponta.x - lado * 7} ${ponta.y + 5}`,
        }
      })

      // o tronco: do começo, por cada nó, até o fim — curvas em S entre eles
      const primeiro = ramos[0].no
      const ultimo = ramos.at(-1)
      const pontos = [
        { x: primeiro.x, y: primeiro.y - ACIMA },
        ...ramos.map((r) => r.no),
        { x: ultimo.no.x, y: ultimo.ponta.y + ABAIXO },
      ]

      let d = `M${pontos[0].x} ${pontos[0].y}`
      const acumulado = [0]
      for (let k = 1; k < pontos.length; k++) {
        const a = pontos[k - 1]
        const b = pontos[k]
        const h = (b.y - a.y) / 2
        const c1 = { x: a.x, y: a.y + h }
        const c2 = { x: b.x, y: b.y - h }
        d += `C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`
        acumulado.push(acumulado[k - 1] + comprimento(a, c1, c2, b))
      }

      setArvore({ tronco: d, pontos, acumulado, ramos })
    }

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(lista)
    return () => observador.disconnect()
  }, [listaRef])

  /* ---- PINTAR: até onde a tinta chegou ---- */
  const pintar = useCallback(() => {
    const lista = listaRef.current
    const a = arvoreRef.current
    if (!lista || !a) return

    /* A linha de leitura, nas coordenadas da lista. Menos movimento: tudo
       pintado.

       A conta usa onde a lista ESTARIA sem o sticky. Quando a seção gruda
       (e fica parada durante a pausa antes do combo), a lista para de subir
       na tela — se a conta usasse a posição real, a tinta parava junto, e o
       último burger nunca era alcançado. Com a posição "sem sticky", a
       tinta continua descendo enquanto você rola a pausa: a página fica
       parada e a árvore termina de se pintar. */
    const secao = lista.closest('.secao-empilhada')
    const deslocamento = secao ? topoSemSticky(secao) - secao.getBoundingClientRect().top : 0
    const linha = reduzido
      ? Infinity
      : window.innerHeight * LINHA_DE_LEITURA - (lista.getBoundingClientRect().top + deslocamento)

    // tronco: quanto do comprimento dele está acima da linha
    const { pontos, acumulado } = a
    const total = acumulado.at(-1)
    let alcance = 0
    if (linha >= pontos.at(-1).y) alcance = total
    else if (linha > pontos[0].y) {
      let k = 0
      while (pontos[k + 1].y <= linha) k++
      const f = (linha - pontos[k].y) / (pontos[k + 1].y - pontos[k].y)
      alcance = acumulado[k] + f * (acumulado[k + 1] - acumulado[k])
    }
    tingir(troncoRef.current, alcance / total)

    // cada galho: pinta enquanto a linha desce do nó até a seta
    a.ramos.forEach((r, i) => {
      const v = limitar((linha - r.no.y) / (r.ponta.y - r.no.y))
      const seta = limitar((v - 0.8) / 0.2)
      tingir(galhosRef.current[i], v)
      tingir(setasRef.current[i], seta)
      nosRef.current[i]?.classList.toggle('aceso', linha >= r.no.y)
      // a seta chegou no burger: a linha dele acende o número (Burgers.jsx
      // + index.css). Rolou pra cima e a tinta recuou, apaga de novo.
      // 0.999 e não 1: (1 - 0.8) / 0.2 dá 0,9999999999999998 no computador
      // (arredondamento de número quebrado), e ">= 1" nunca batia.
      lista.children[i]?.toggleAttribute('data-chegou', seta >= 0.999)
    })
  }, [listaRef, reduzido])

  useMotionValueEvent(scrollY, 'change', pintar)
  // árvore nova (medida de novo): pinta já, sem esperar a próxima rolagem
  useLayoutEffect(() => {
    arvoreRef.current = arvore
    pintar()
  }, [arvore, pintar])

  if (!arvore) return null

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
      {/* a árvore inteira em cinza, por baixo */}
      <g className="arvore-base">
        <path d={arvore.tronco} />
        {arvore.ramos.map((r, i) => (
          <g key={i}>
            <path d={r.galho} />
            <path d={r.seta} />
          </g>
        ))}
      </g>

      {/* a tinta, por cima, descobrindo conforme rola */}
      <g className="arvore-tinta">
        <path ref={troncoRef} d={arvore.tronco} pathLength="1" />
        {arvore.ramos.map((r, i) => (
          <g key={i}>
            <path ref={(el) => { galhosRef.current[i] = el }} d={r.galho} pathLength="1" />
            <path ref={(el) => { setasRef.current[i] = el }} d={r.seta} pathLength="1" />
          </g>
        ))}
      </g>

      {/* os nós: um anel cinza que acende por dentro quando a tinta chega */}
      {arvore.ramos.map((r, i) => (
        <g key={i} ref={(el) => { nosRef.current[i] = el }} className="arvore-no">
          <circle cx={r.no.x} cy={r.no.y} r="4.5" />
          <circle cx={r.no.x} cy={r.no.y} r="2.5" className="arvore-no-luz" />
        </g>
      ))}
    </svg>
  )
}

import { useEffect, useRef } from 'react'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   MARCA-TEXTO — a seleção de texto vira traço de caneta (Lidera360)
   ----------------------------------------------------------------------------
   Porte do script do Lidera360, com os mesmos números: você solta o mouse,
   espera um instante (ATRASO — o "delay gostoso") e um traço vermelho passa
   por cima da seleção da esquerda pra direita, uma linha depois da outra
   (ESCALONAR). A seleção de verdade continua lá: Ctrl+C funciona normal,
   isto é só a pintura por cima.

   Os traços moram numa camada fixa do tamanho da tela, em coordenadas da
   TELA — por isso somem ao rolar ou redimensionar (recalcular a cada
   rolagem custaria mais do que vale).

   TRÊS CUIDADOS QUE O ORIGINAL NÃO TINHA
   1. Só liga com mouse de verdade e sem "reduzir movimento". No celular a
      seleção é por toque longo, sem mouseup — com a nativa transparente,
      a pessoa selecionaria sem ver nada. Nesses casos fica a seleção
      nativa (vermelha). Quem decide é o data-marca-texto no <html>.
   2. Os retângulos vêm só dos TEXTOS selecionados. Pedir os retângulos da
      seleção inteira devolve também a caixa de cada elemento selecionado
      por completo — um parágrafo inteiro virava um bloco pintado.
   3. Retângulos da mesma linha que se tocam viram um traço só. Dois
      pedaços sobrepostos pintados um em cima do outro deixavam uma
      emenda mais forte no meio da linha.
   ========================================================================== */

const ATRASO = 40 // ms entre soltar o mouse e a caneta começar
const ESCALONAR = 25 // ms entre uma linha e a próxima

export default function MarcaTexto() {
  const camadaRef = useRef(null)
  const semMovimento = useMenosMovimento()

  useEffect(() => {
    const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (semMovimento || !temMouse) return

    const raiz = document.documentElement
    const camada = camadaRef.current
    raiz.dataset.marcaTexto = '' // o CSS deixa a seleção nativa transparente

    let espera = null
    const limpar = () => camada.replaceChildren()

    const pintar = () => {
      limpar()
      const selecao = window.getSelection()
      if (!selecao || selecao.isCollapsed || !selecao.rangeCount) return

      const linhas = juntarPorLinha(retangulosDoTexto(selecao.getRangeAt(0)))
      const tracos = linhas.map((r, i) => {
        const traco = document.createElement('span')
        traco.className = 'marca-texto-traco'
        traco.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;transition-delay:${i * ESCALONAR}ms`
        camada.appendChild(traco)
        return traco
      })

      // força o navegador a desenhar o estado inicial (scaleX 0) antes do
      // final — sem isso ele junta os dois e o traço aparece sem animar
      void camada.offsetWidth
      tracos.forEach((t) => t.classList.add('pintado'))
    }

    const agendar = () => {
      clearTimeout(espera)
      espera = setTimeout(pintar, ATRASO)
    }

    // seleção pelo teclado (Shift+setas, Ctrl+A) também pinta
    const aoSoltarTecla = (e) => {
      if (e.shiftKey || e.key === 'a' || e.key === 'A') agendar()
    }

    // desmarcou (clicou fora, apertou Esc...): apaga na hora
    const aoMudarSelecao = () => {
      const selecao = window.getSelection()
      if (!selecao || selecao.isCollapsed) {
        clearTimeout(espera)
        limpar()
      }
    }

    document.addEventListener('mouseup', agendar)
    document.addEventListener('keyup', aoSoltarTecla)
    document.addEventListener('selectionchange', aoMudarSelecao)
    window.addEventListener('scroll', limpar, true)
    window.addEventListener('resize', limpar)

    return () => {
      clearTimeout(espera)
      limpar()
      delete raiz.dataset.marcaTexto
      document.removeEventListener('mouseup', agendar)
      document.removeEventListener('keyup', aoSoltarTecla)
      document.removeEventListener('selectionchange', aoMudarSelecao)
      window.removeEventListener('scroll', limpar, true)
      window.removeEventListener('resize', limpar)
    }
  }, [semMovimento])

  return <div ref={camadaRef} aria-hidden="true" className="marca-texto-camada" />
}

/* Retângulos de cada pedaço de TEXTO dentro da seleção, só os que estão na
   tela. Texto escondido (sr-only, visibility:hidden) fica de fora — o
   sr-only, por exemplo, é um texto espremido num quadradinho de 1px, e os
   retângulos dele iam parar em lugares sem nada escrito. */
function retangulosDoTexto(trecho) {
  const base = trecho.commonAncestorContainer
  const raiz = base.nodeType === Node.TEXT_NODE ? base.parentNode : base
  const caminhante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
  const altura = window.innerHeight
  const retangulos = []

  // o próprio nó de texto, quando a seleção inteira está dentro de um só
  let no = base.nodeType === Node.TEXT_NODE ? base : caminhante.nextNode()

  while (no) {
    if (trecho.intersectsNode(no) && no.textContent.trim() && textoVisivel(no.parentElement)) {
      const pedaco = document.createRange()
      pedaco.selectNodeContents(no)
      if (no === trecho.startContainer) pedaco.setStart(no, trecho.startOffset)
      if (no === trecho.endContainer) pedaco.setEnd(no, trecho.endOffset)

      for (const r of pedaco.getClientRects()) {
        if (r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < altura) retangulos.push(r)
      }
    }
    if (no === base) break
    no = caminhante.nextNode()
  }

  return retangulos
}

function textoVisivel(el) {
  if (!el || el.closest('.sr-only')) return false
  return getComputedStyle(el).visibility === 'visible'
}

/* Junta retângulos da mesma linha que se tocam (ou quase) num só. */
function juntarPorLinha(retangulos) {
  const ordenados = [...retangulos].sort((a, b) => a.top - b.top || a.left - b.left)
  const linhas = []

  for (const r of ordenados) {
    const atual = linhas.at(-1)
    const mesmaLinha =
      atual &&
      Math.min(atual.bottom, r.bottom) - Math.max(atual.top, r.top) >
        0.6 * Math.min(atual.height, r.height)

    if (mesmaLinha && r.left <= atual.right + 4) {
      const left = Math.min(atual.left, r.left)
      const right = Math.max(atual.right, r.right)
      const top = Math.min(atual.top, r.top)
      const bottom = Math.max(atual.bottom, r.bottom)
      Object.assign(atual, { left, right, top, bottom, width: right - left, height: bottom - top })
    } else {
      linhas.push({
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      })
    }
  }

  return linhas
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ============================================================================
   PALAVRA TRAÇADA — o StrokeText do ReactBits, adaptado pra uma palavra
   ----------------------------------------------------------------------------
   Mesma técnica do StrokeText (reactbits.dev): o CONTORNO das letras se
   desenha sozinho, uma letra depois da outra, e depois a cor preenche a
   palavra varrendo da esquerda pra direita.

   POR QUE NÃO O COMPONENTE ORIGINAL
   O StrokeText é feito pra ser um título sozinho: ocupa 100% da largura,
   centraliza o texto dentro de um SVG de altura fixa (fontSize × 1,3) e
   recebe o tamanho da fonte em px por prop. Aqui a palavra precisa morar
   DENTRO do <h1>, na linha dela, alinhada à esquerda com o "LANCHE DE",
   no tamanho responsivo do título — e a moldura do FocoRevela precisa
   conseguir medir a caixa da palavra. Então virou um componente nosso.

   COMO É MONTADA (três camadas no mesmo lugar):
   1. O texto HTML de verdade, na cor final. É ele que dá o tamanho da
      caixa (a moldura mede ele) e é ele o PREENCHIMENTO — escondido por um
      clip-path que abre da esquerda pra direita.
   2. Um SVG por cima, do tamanho exato da caixa, com a mesma palavra em
      <text> só com contorno. Cada letra é um <tspan> com stroke-dasharray;
      animar o stroke-dashoffset do tamanho do traço até 0 "desenha" a
      letra. Cada letra começa um pouco depois da anterior.
   3. Uma "sonda": um elemento de altura zero alinhado na linha de base do
      texto. A posição dela diz onde fica a base das letras, e é ali que o
      <text> do SVG é posicionado — é o que faz contorno e preenchimento
      caírem exatamente um em cima do outro.

   O SVG herda fonte, tamanho e espaçamento do título (font: inherit), então
   acompanha o tamanho responsivo sem receber número nenhum por prop.
   ========================================================================== */
export default function PalavraTracada({
  texto,
  cor,
  ativa,
  pular = false,
  refRaiz,
  onDesenhada,
  duracao = 0.7,
  escalonamento = 0.035,
  atrasoPreenchimento = 0.45,
  duracaoPreenchimento = 0.45,
}) {
  const raizRef = useRef(null)
  const sondaRef = useRef(null)
  const [medidas, setMedidas] = useState(null)
  // oculta → desenhando → pronta
  const [fase, setFase] = useState(pular ? 'pronta' : 'oculta')

  /* MEDIÇÃO: tamanho da caixa, linha de base, tamanho da fonte e se o
     título está em caixa alta. Refeita quando a caixa muda (tela
     redimensionada) e quando a fonte termina de carregar. */
  useLayoutEffect(() => {
    const raiz = raizRef.current
    if (!raiz) return

    const medir = () => {
      const estilo = getComputedStyle(raiz)
      setMedidas({
        largura: raiz.offsetWidth,
        altura: raiz.offsetHeight,
        base: sondaRef.current?.offsetTop ?? 0,
        fonte: parseFloat(estilo.fontSize),
        // o <h1> é text-transform: uppercase. O <text> do SVG recebe a
        // palavra JÁ em maiúsculas — alguns navegadores não aplicam
        // text-transform em SVG, e o contorno sairia minúsculo por cima do
        // preenchimento maiúsculo.
        maiusculas: estilo.textTransform === 'uppercase',
      })
    }

    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(raiz)
    document.fonts?.ready.then(medir)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    if (ativa && fase === 'oculta') setFase('desenhando')
  }, [ativa, fase])

  /* Fim do desenho: o que terminar por último — o contorno da última letra
     ou a varredura do preenchimento. */
  const letras = Array.from(medidas?.maiusculas ? texto.toUpperCase() : texto)
  useEffect(() => {
    if (fase !== 'desenhando') return
    const fimContorno = duracao + escalonamento * (letras.length - 1)
    const fimPreenchimento = atrasoPreenchimento + duracaoPreenchimento
    const id = setTimeout(() => {
      setFase('pronta')
      onDesenhada?.()
    }, Math.max(fimContorno, fimPreenchimento) * 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase])

  const visivel = fase !== 'oculta'
  const animando = fase === 'desenhando'
  // comprimento do traço: maior que o contorno de qualquer letra. Com ele
  // "sobrando", o dashoffset começa com a letra inteira escondida.
  const traco = (medidas?.fonte ?? 100) * 4

  return (
    <span
      ref={(el) => {
        raizRef.current = el
        refRaiz?.(el)
      }}
      className="relative inline-block"
    >
      {/* 1. preenchimento (o texto de verdade) */}
      <span
        style={{
          color: cor,
          clipPath: visivel ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
          transition: animando
            ? `clip-path ${duracaoPreenchimento}s cubic-bezier(0.65, 0, 0.35, 1) ${atrasoPreenchimento}s`
            : 'none',
        }}
      >
        {texto}
      </span>

      {/* 3. sonda da linha de base */}
      <span ref={sondaRef} aria-hidden="true" className="inline-block h-0 w-0 align-baseline" />

      {/* 2. contorno */}
      {medidas && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width={medidas.largura}
          height={medidas.altura}
        >
          <text
            x="0"
            y={medidas.base}
            fill="none"
            strokeWidth={Math.max(1.2, medidas.fonte * 0.018)}
            strokeLinejoin="round"
            strokeLinecap="round"
            // a cor vai no style e não no atributo stroke: atributo de SVG não
            // aceita var(--...), e a cor aqui é um token do tema
            style={{ stroke: cor, font: 'inherit', letterSpacing: 'inherit', textTransform: 'none' }}
          >
            {letras.map((letra, i) => (
              <tspan
                key={i}
                style={{
                  strokeDasharray: traco,
                  strokeDashoffset: visivel ? 0 : traco,
                  transition: animando
                    ? `stroke-dashoffset ${duracao}s cubic-bezier(0.33, 1, 0.68, 1) ${i * escalonamento}s`
                    : 'none',
                }}
              >
                {letra}
              </tspan>
            ))}
          </text>
        </svg>
      )}
    </span>
  )
}

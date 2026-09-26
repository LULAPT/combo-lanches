import { useMemo } from 'react'
import Logo from '@/components/Logo'

/* ============================================================================
   QR CODE FALSO — pro Pix simulado
   ----------------------------------------------------------------------------
   Tem a ANATOMIA de um QR de verdade, pra parecer um na tela:
   - os três quadrados de canto (os "olhos" que a câmera procura);
   - as linhas de tempo (o pontilhado que liga os olhos);
   - o quadradinho de alinhamento perto do canto de baixo;
   - a margem branca em volta.
   O miolo, que num QR de verdade carrega a informação, aqui é SORTEADO — e
   não é um sorteio qualquer: a semente é o código do pedido, então o mesmo
   pedido desenha sempre o mesmo QR (não fica piscando a cada render).

   Não aponta pra cobrança nenhuma: uma câmera que tentar ler não acha nada.
   É de propósito — enquanto não existe back-end, não pode existir um QR que
   alguém consiga pagar.

   No meio, a logo num quadrado branco, como os QR de loja costumam ter.
   ========================================================================== */

const TAMANHO = 29 // módulos por lado — o de um QR "versão 3"
const MARGEM = 2 // a margem branca, em módulos
const MIOLO_LOGO = 9 // o quadrado do meio que fica vazio pra logo

// transforma o texto num número (FNV-1a) — a semente do sorteio
function sementeDe(texto) {
  let h = 2166136261
  for (const c of texto) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// sorteio com semente (mulberry32): mesma semente, mesma sequência
function sorteador(semente) {
  let a = semente
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function montarMatriz(codigo) {
  const N = TAMANHO
  const escuro = Array.from({ length: N }, () => Array(N).fill(false))
  const fixo = Array.from({ length: N }, () => Array(N).fill(false))
  const marcar = (r, c, valor) => {
    if (r < 0 || c < 0 || r >= N || c >= N) return
    escuro[r][c] = valor
    fixo[r][c] = true
  }

  // os três olhos: anel 7×7, miolo 3×3, e um contorno claro em volta
  for (const [r0, c0] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const dentro = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const anel = r === 0 || r === 6 || c === 0 || c === 6
        const miolo = r >= 2 && r <= 4 && c >= 2 && c <= 4
        marcar(r0 + r, c0 + c, dentro && (anel || miolo))
      }
    }
  }

  // as linhas de tempo
  for (let i = 8; i < N - 8; i++) {
    marcar(6, i, i % 2 === 0)
    marcar(i, 6, i % 2 === 0)
  }

  // o quadradinho de alinhamento
  const a = N - 7
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) marcar(a + r, a + c, Math.max(Math.abs(r), Math.abs(c)) !== 1)
  }

  // o vão da logo, no meio
  const ini = Math.floor((N - MIOLO_LOGO) / 2)
  for (let r = ini; r < ini + MIOLO_LOGO; r++) {
    for (let c = ini; c < ini + MIOLO_LOGO; c++) marcar(r, c, false)
  }

  // o resto: sorteado
  const sortear = sorteador(sementeDe(codigo))
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) if (!fixo[r][c]) escuro[r][c] = sortear() < 0.5
  }

  return escuro
}

export default function QrCodeFalso({ codigo, className = '' }) {
  // um caminho só com todos os quadradinhos escuros: 1 elemento, não 400
  const caminho = useMemo(() => {
    const matriz = montarMatriz(codigo)
    let d = ''
    matriz.forEach((linha, r) =>
      linha.forEach((escuro, c) => {
        if (escuro) d += `M${c} ${r}h1v1h-1z`
      }),
    )
    return d
  }, [codigo])

  const lado = TAMANHO + MARGEM * 2

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`${-MARGEM} ${-MARGEM} ${lado} ${lado}`}
        role="img"
        aria-label="QR code do Pix (simulação)"
        className="block size-full rounded-2xl"
        // sem suavização: os quadradinhos ficam com a quina seca, como num QR
        shapeRendering="crispEdges"
      >
        <rect x={-MARGEM} y={-MARGEM} width={lado} height={lado} fill="#fff" />
        <path d={caminho} fill="#111113" />
      </svg>

      {/* a logo no vão do meio */}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-[24%] place-items-center rounded-lg bg-white p-1">
          {/* só a altura: a largura sai da proporção da logo (ela é mais
              larga que alta, por isso 80% — a 100% vazaria pelos lados) */}
          <Logo className="h-[80%]" />
        </span>
      </span>
    </div>
  )
}

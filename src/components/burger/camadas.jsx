/* ============================================================================
   CATÁLOGO DE CAMADAS
   ----------------------------------------------------------------------------
   Cada recheio de burger desenhado em SVG, visto de lado — o mesmo ângulo
   da logo. Tudo é gerado por código (ondas, pingos) em vez de path
   desenhado à mão num editor: assim dá pra ajustar "alface mais ondulada"
   mudando um número, e o arquivo continua legível.

   Sistema de coordenadas: toda camada tem 400 de largura no viewBox. A
   altura (`vb`) varia. `espessura` é quanto ela OCUPA na pilha — pode ser
   menor que `vb` porque pingos de queijo e babados de alface transbordam
   por cima da camada de baixo, como num lanche de verdade.

   `largura` é em % da largura da logo (a palavra COMBO = 100). O pão de
   cima tem 81, o de baixo 90: a alface passa um pouco disso pra "vazar"
   pelas bordas.

   Os paths são calculados UMA vez, quando o módulo carrega — não a cada
   render. Por isso ficam aqui fora dos componentes.
   ========================================================================== */

const r1 = (n) => Math.round(n * 10) / 10

/* Pontos de uma senoide entre x0 e x1. É a base de tudo que é ondulado. */
function onda(x0, x1, y, amp, ciclos, fase = 0, passos = 72) {
  const pontos = []
  for (let i = 0; i <= passos; i++) {
    const t = i / passos
    pontos.push([
      x0 + (x1 - x0) * t,
      y + amp * Math.sin(Math.PI * 2 * ciclos * t + fase),
    ])
  }
  return pontos
}

const traco = (pontos, inicio = 'M') =>
  pontos
    .map(([x, y], i) => `${i === 0 ? inicio : 'L'}${r1(x)} ${r1(y)}`)
    .join(' ')

/* Faixa fechada com as duas bordas onduladas: vai pela de cima, volta pela
   de baixo (invertida) e fecha. */
const faixa = (cima, baixo) =>
  `${traco(cima)} ${traco([...baixo].reverse(), 'L')} Z`

/* Pingo arredondado (molho, mussarela derretida). */
function pingo(x, y, larg, comp) {
  const m = larg / 2
  return `M${r1(x - m)} ${r1(y)} C${r1(x - m)} ${r1(y + comp * 0.55)} ${r1(x - larg * 0.3)} ${r1(y + comp)} ${r1(x)} ${r1(y + comp)} C${r1(x + larg * 0.3)} ${r1(y + comp)} ${r1(x + m)} ${r1(y + comp * 0.55)} ${r1(x + m)} ${r1(y)} Z`
}

/* Ponta triangular (a quina da fatia de cheddar caindo pelo lado). */
function ponta(x, y, larg, comp) {
  const m = larg / 2
  return `M${r1(x - m)} ${r1(y)} L${r1(x - 3)} ${r1(y + comp - 3)} Q${r1(x)} ${r1(y + comp + 1.5)} ${r1(x + 3)} ${r1(y + comp - 3)} L${r1(x + m)} ${r1(y)} Z`
}

/* Pseudoaleatório com semente: mesmo resultado a cada carregamento. Com
   Math.random() as pintinhas da carne mudariam de lugar a cada F5 — e o
   hambúrguer "tremeria" entre o servidor de dev recarregar e não. */
function sementes(qtd, semente) {
  let s = semente
  const proximo = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: qtd }, () => [proximo(), proximo(), proximo()])
}

const BRILHO = 'rgb(255 255 255 / 0.4)'

/* ---------------------------------------------------------------------------
   AS CAMADAS
   `cores` vira um degradê vertical (mais claro em cima) — é o que imita o
   brilho 3D da logo. Quem precisa de uma segunda cor (a gema do ovo) usa
   `cores2`, que vira o segundo degradê (`g2`).
-------------------------------------------------------------------------- */

const saladaCima = onda(0, 400, 9, 5, 6.5, 0.4)
const saladaBaixo = onda(0, 400, 35, 6, 8.5, 1.3)

const carneCima = onda(34, 366, 5, 1.8, 12, 0.3)
const carneBaixo = onda(34, 366, 51, 2, 10, 1.1)
const carnePintas = sementes(40, 7)

const baconCima = onda(0, 400, 4, 4, 3)
const baconBaixo = onda(0, 400, 18, 4, 3)

const ovoCima = onda(10, 390, 8, 1.8, 3, 0.5)
const ovoBaixo = onda(10, 390, 22, 2.2, 4, 1)

const cebolaCima = onda(0, 400, 5, 3, 5, 0.2)
const cebolaBaixo = onda(0, 400, 20, 3.5, 6, 1.4)

export const CAMADAS = {
  salada: {
    nome: 'Salada',
    largura: 94,
    vb: 46,
    espessura: 36,
    cores: ['#a9e460', '#6cbb3a', '#3c8a26'],
    desenhar: (g) => (
      <>
        <path d={faixa(saladaCima, saladaBaixo)} fill={g} />
        <path
          d={traco(onda(8, 392, 12.5, 4, 6.5, 0.4))}
          fill="none"
          stroke={BRILHO}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* nervuras da folha */}
        <path
          d="M58 17 Q80 27 70 36 M150 15 Q172 25 160 35 M244 17 Q266 27 254 37 M332 16 Q352 26 342 35"
          fill="none"
          stroke="#dff7b3"
          strokeOpacity="0.5"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },

  queijo: {
    nome: 'Mussarela',
    largura: 86,
    vb: 28,
    espessura: 13,
    cores: ['#fff6d2', '#efd27d'],
    desenhar: (g) => (
      <>
        <rect x="4" y="0" width="392" height="13" rx="6.5" fill={g} />
        <path d={`${pingo(118, 9, 26, 15)} ${pingo(292, 9, 18, 10)}`} fill={g} />
        <path d="M16 3.8 H384" stroke={BRILHO} strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },

  cheddar: {
    nome: 'Cheddar',
    largura: 88,
    vb: 44,
    espessura: 14,
    cores: ['#ffc83f', '#f7a41c', '#ea830b'],
    desenhar: (g) => (
      <>
        <rect x="0" y="0" width="400" height="14" rx="4" fill={g} />
        <path
          d={`${ponta(66, 10, 54, 30)} ${ponta(214, 10, 62, 33)} ${ponta(344, 10, 48, 26)}`}
          fill={g}
        />
        <path d="M10 3.8 H390" stroke={BRILHO} strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },

  ovo: {
    nome: 'Ovo',
    largura: 84,
    vb: 28,
    espessura: 20,
    cores: ['#fffdf5', '#e6dcc6'],
    cores2: ['#ffd65a', '#f2930d'],
    desenhar: (g, g2) => (
      <>
        <path d={faixa(ovoCima, ovoBaixo)} fill={g} />
        <ellipse cx="200" cy="8" rx="64" ry="13" fill={g2} />
        <ellipse cx="178" cy="3.5" rx="18" ry="3.6" fill="rgb(255 255 255 / 0.6)" />
      </>
    ),
  },

  bacon: {
    nome: 'Bacon',
    largura: 90,
    vb: 24,
    espessura: 17,
    cores: ['#cc5a35', '#9c3a1f', '#772614'],
    desenhar: (g) => (
      <>
        <path d={faixa(baconCima, baconBaixo)} fill={g} />
        {/* as listras de gordura acompanham a ondulação da tira */}
        <path
          d={traco(onda(0, 400, 9, 4, 3))}
          fill="none"
          stroke="#f7d3b2"
          strokeOpacity="0.6"
          strokeWidth="2.4"
        />
        <path
          d={traco(onda(0, 400, 13.5, 4, 3))}
          fill="none"
          stroke="#f7d3b2"
          strokeOpacity="0.32"
          strokeWidth="1.4"
        />
        <path
          d={traco(onda(6, 394, 5.6, 4, 3))}
          fill="none"
          stroke="rgb(255 255 255 / 0.22)"
          strokeWidth="1.2"
        />
      </>
    ),
  },

  calabresa: {
    nome: 'Calabresa',
    largura: 88,
    vb: 26,
    espessura: 18,
    cores: ['#d4412f', '#a52618', '#851a10'],
    desenhar: (g) => (
      <>
        {[0, 1.5, -1, 1, -1.5, 0.5].map((dy, i) => (
          <g key={i}>
            <ellipse
              cx={34 + i * 66.4}
              cy={11 + dy}
              rx="38"
              ry="10"
              fill={g}
              stroke="#ec7a62"
              strokeOpacity="0.7"
              strokeWidth="1.4"
            />
            <ellipse cx={24 + i * 66.4} cy={7 + dy} rx="12" ry="2.4" fill="rgb(255 255 255 / 0.25)" />
          </g>
        ))}
      </>
    ),
  },

  carne: {
    nome: 'Carne',
    largura: 90,
    vb: 56,
    espessura: 52,
    cores: ['#91502a', '#5f2d14', '#361708'],
    desenhar: (g) => (
      <>
        <path
          d={`M8 28 C8 10 18 5 34 5 ${traco(carneCima, 'L')} C382 5 392 10 392 28 C392 46 382 51 366 51 ${traco([...carneBaixo].reverse(), 'L')} C18 51 8 46 8 28 Z`}
          fill={g}
        />
        {/* pintinhas de tostado: metade escura, metade clara */}
        {carnePintas.map(([a, b, c], i) => (
          <circle
            key={i}
            cx={r1(26 + a * 348)}
            cy={r1(13 + b * 30)}
            r={r1(0.9 + c * 1.7)}
            fill={i % 2 ? '#2a1105' : '#bf7443'}
            opacity={i % 2 ? 0.5 : 0.35}
          />
        ))}
        <path
          d={traco(onda(30, 370, 10, 1.6, 12, 0.3))}
          fill="none"
          stroke="#dc9864"
          strokeOpacity="0.55"
          strokeWidth="2"
        />
        <path
          d={traco(onda(30, 370, 47, 1.8, 10, 1.1))}
          fill="none"
          stroke="#1d0b03"
          strokeOpacity="0.5"
          strokeWidth="3"
        />
      </>
    ),
  },

  cebola: {
    nome: 'Cebola caramelizada',
    largura: 88,
    vb: 27,
    espessura: 18,
    cores: ['#eaa84e', '#c77a2c', '#a35516'],
    desenhar: (g) => (
      <>
        <path d={faixa(cebolaCima, cebolaBaixo)} fill={g} />
        {/* fios de cebola: arcos escuros e claros sobrepostos */}
        <path
          d="M20 13 Q60 3 100 13 M90 17 Q140 7 180 16 M170 12 Q215 2 255 13 M250 17 Q300 7 340 15 M322 12 Q360 4 394 13"
          fill="none"
          stroke="#7a3b0e"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M40 10 Q80 1 118 10 M140 13 Q182 4 222 12 M262 12 Q306 3 346 11"
          fill="none"
          stroke="#fbd99c"
          strokeOpacity="0.5"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },

  molho: {
    nome: 'Molho caseiro',
    largura: 86,
    vb: 26,
    espessura: 10,
    cores: ['#f6663b', '#c3301a'],
    desenhar: (g) => (
      <>
        <rect x="0" y="0" width="400" height="10" rx="5" fill={g} />
        <path
          d={`${pingo(92, 7, 17, 14)} ${pingo(170, 7, 12, 9)} ${pingo(262, 7, 19, 16)} ${pingo(334, 7, 11, 8)}`}
          fill={g}
        />
        <path d="M12 2.8 H388" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
}

/* Quanto a camada ocupa na pilha, já em % da largura da logo. */
export const espessuraDa = (tipo) =>
  (CAMADAS[tipo].espessura * CAMADAS[tipo].largura) / 400

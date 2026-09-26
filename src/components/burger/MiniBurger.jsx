import { FOLGA_ABERTO, FOLGA_FECHADO, empilhar } from './geometria'
import Camada from './Camada'

/* ============================================================================
   MINI BURGER
   ----------------------------------------------------------------------------
   Um lanche do cardápio desenhado com as camadas que a descrição dele lista
   (o array `camadas` de cada item em cardapio.js). Com `aberto`, as camadas
   se afastam — o mesmo gesto da hero, em miniatura.

   A animação de abrir é CSS puro: o pai muda data-aberto, a variável
   --abrir vai de 0 a 1 (ela é registrada com @property no index.css, e é
   isso que permite a transição), e cada camada anda --dy × --abrir.
   Nenhum re-render por frame.

   Camada nova (o cliente põe +1 bacon no modal) entra com @starting-style —
   CSS novo que define "de onde" um elemento recém-criado começa a
   transição. Sem ele, a camada simplesmente brotaria no lugar.

   O tamanho vem do pai: o mini burger ocupa 100% da largura que receber, e
   tudo dentro é em cqw (% dessa largura). Coloque dentro de um w-40 e ele
   é um burger de 160px; num w-20, de 80px.

   `justo`: a caixa fica do tamanho do burger FECHADO, sem reservar o espaço
   de abrir. Pra miniaturas que nunca abrem (a sacola): sem isso, um burger
   de muitas camadas reservava tanto espaço em cima e embaixo que passava da
   caixa quadrada e aparecia cortado — e cada burger ficava numa altura.
   ========================================================================== */


export default function MiniBurger({ camadas = [], aberto = false, justo = false, className = '' }) {
  const tipos = ['topo', ...camadas, 'base']

  const fechado = empilhar(tipos, FOLGA_FECHADO)
  const explodido = empilhar(tipos, FOLGA_ABERTO)

  // A caixa tem a altura do burger ABERTO, e o fechado fica centralizado
  // nela. Assim abrir não empurra o texto em volta: o burger cresce pra
  // cima e pra baixo dentro de um espaço que já estava reservado.
  const recuo = justo ? 0 : (explodido.altura - fechado.altura) / 2
  const alturaCaixa = justo ? fechado.altura : explodido.altura

  // Chave estável por tipo + ocorrência ("bacon-0", "bacon-1"). Usar o
  // índice do array como key faria o React achar que a camada 3 "virou"
  // bacon quando você insere um bacon no meio — e a animação de entrada
  // rodaria na camada errada.
  const contagem = {}
  const chaves = tipos.map((tipo) => {
    contagem[tipo] = (contagem[tipo] ?? 0) + 1
    return `${tipo}-${contagem[tipo]}`
  })

  return (
    <div
      className={`mini-burger relative w-full ${className}`}
      data-aberto={aberto}
      aria-hidden="true"
    >
      <div
        className="relative transition-[height] duration-500"
        style={{ height: `${alturaCaixa}cqw` }}
      >
        {fechado.pecas.map((peca, i) => {
          const topoFechado = peca.topo + recuo
          const dy = explodido.pecas[i].topo - topoFechado

          return (
            <div
              key={chaves[i]}
              className="camada-mini absolute transition-[top,opacity,scale] duration-500
                         ease-(--ease-mordida) starting:scale-50 starting:opacity-0"
              style={{
                top: `${topoFechado}cqw`,
                left: `${peca.esquerda}cqw`,
                width: `${peca.largura}cqw`,
                // de cima pra baixo: a camada de cima fica POR CIMA, senão
                // os pingos de queijo sumiriam atrás da carne
                zIndex: tipos.length - i,
                '--dy': dy,
              }}
            >
              <Camada tipo={peca.tipo} />
            </div>
          )
        })}
      </div>

      {/* sombra de contato no "chão" — sem ela o burger parece flutuar
          colado num fundo de papel */}
      <div
        className="pointer-events-none absolute left-[12cqw] h-[8cqw] w-[76cqw] rounded-[50%]
                   bg-[radial-gradient(closest-side,var(--sombra-burger),transparent)]"
        // rente à base do burger fechado
        style={{ top: `calc(${fechado.altura + recuo}cqw - 3cqw)` }}
      />
    </div>
  )
}

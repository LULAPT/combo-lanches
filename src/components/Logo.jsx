import { motion } from 'motion/react'
import { LOGO } from '@/components/burger/geometria'
import { ENTRADA, MOLA_ENTRADA } from '@/components/burger/entrada'
import { PalavraCombo, PaoBase, PaoTopo } from '@/components/burger/pecasLogo'
import { useMenosMovimento } from '@/hooks/useMenosMovimento'

/* ============================================================================
   LOGO
   ----------------------------------------------------------------------------
   Um componente só pros lugares que mostram a marca (cabeçalho do celular,
   trilho do desktop, rodapé).

   É a logo VETORIAL: as mesmas três peças do burger da hero (pecasLogo.jsx)
   montadas na posição da logo fechada (geometria.js). Já foi um PNG
   recortado do JPEG do iFood, com a borda serrilhada e o fundo cinza mal
   removido — o PNG saiu do projeto (está em _backups, fora do repositório).
   Borda limpa em qualquer tamanho, e o COMBO é do mesmo vermelho do resto
   do site: troca de tom junto com o tema.

   COMO AS PEÇAS SE ENCAIXAM
   Um <svg> de fora com a caixa da logo inteira (100 de largura por
   LOGO.altura) e, dentro dele, um <svg> por peça, posicionado com x/y/
   largura/altura em unidades dessa caixa. Cada peça continua desenhando no
   próprio viewBox dela — só é "encaixada" no lugar.

   Por que <svg> e não uma <div> com as peças em position:absolute: um <svg>
   com viewBox tem proporção própria, como uma <img>. Aí `h-10` basta — a
   largura sai sozinha da proporção, em qualquer lugar do layout.

   A sombra (`drop-shadow`) segue o contorno do desenho, não um retângulo, e
   é o que dá leitura ao pão amarelo no tema claro.

   `circulo`: versão dentro de um disco (trilho do desktop, pílula do
   celular).
   ========================================================================== */

const PECAS = [
  ['topo', PaoTopo],
  ['combo', PalavraCombo],
  ['base', PaoBase],
]

export default function Logo({ className = 'h-10', circulo = false }) {
  const marca = (
    <svg
      viewBox={`0 0 100 ${LOGO.altura}`}
      role="img"
      aria-label="Combo Lanches"
      className={`w-auto shrink-0 overflow-visible drop-shadow-[0_2px_3px_var(--sombra-burger)] ${
        circulo ? 'h-[58%]' : className
      }`}
    >
      {PECAS.map(([tipo, Peca]) => {
        const { esquerda, topo, largura, altura } = LOGO[tipo]
        return (
          <svg key={tipo} x={esquerda} y={topo} width={largura} height={altura} overflow="visible">
            {/* sem o reflexo animado do COMBO: aqui ele só distrairia */}
            <Peca className="overflow-visible" brilho={false} />
          </svg>
        )
      })}
    </svg>
  )

  if (!circulo) return marca

  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-painel-2 ${className}`}>
      {marca}
    </span>
  )
}

/* ----------------------------------------------------------------------------
   LOGO MONTANDO — a logo cinza do trilho aberto
   A versão "protótipo": é a logo que aparece no F5 enquanto as peças da hero
   ainda estão entrando (semitransparentes sobre o escuro), só que sem cor —
   cinza, pra combinar com o vidro da nav. O visual está no .logo-cinza
   (index.css).

   E ela se MONTA toda vez que o trilho abre: a mesma entrada da hero
   (burger/entrada.js) — o pão de cima cai, o de baixo sobe, o COMBO estoura
   no meio e os pães fecham nele.

   `montada` liga e desliga:
     true   as peças vêm pro lugar, cada uma no seu atraso, com a mola
     false  voltam pra posição de partida NA HORA (duração 0) — mas só 0,4s
            depois, quando o trilho já fechou e ela não aparece mais. Assim
            a próxima abertura começa do zero e a animação se repete.

   Aqui é HTML (cada peça numa <span>), não um <svg> só como a Logo acima:
   o "cai de 160%" é da altura da PRÓPRIA peça, e porcentagem em transform
   de elemento HTML é do próprio elemento — igual na hero.

   `cinza={false}`: a mesma montagem, nas cores da logo. É a do APP
   (celular): a abertura, o botão do meio da barra de abas e a tela da Loja.
   Pra repetir a montagem lá, quem usa troca a `key` (remontar = começar
   de "fora").

   `desdeFora={false}`: nasce JÁ montada, sem animar a entrada. É a logo
   que chega voando da abertura do app até a barra de abas — ela se montou
   lá no meio da tela, não precisa se montar de novo.
-------------------------------------------------------------------------- */
export function LogoMontando({ montada, cinza = true, desdeFora = true, className = '' }) {
  const reduzido = useMenosMovimento()

  return (
    <span
      role="img"
      aria-label="Combo Lanches"
      className={`${cinza ? 'logo-cinza' : ''} relative block ${className}`}
      style={{ aspectRatio: `100 / ${LOGO.altura}` }}
    >
      {PECAS.map(([tipo, Peca]) => {
        const { esquerda, topo, largura } = LOGO[tipo]
        const { initial, delay } = ENTRADA[tipo]

        return (
          <motion.span
            key={tipo}
            className="absolute block"
            style={{
              left: `${esquerda}%`,
              top: `${(topo / LOGO.altura) * 100}%`,
              width: `${largura}%`,
            }}
            variants={{
              fora: { ...initial, transition: { duration: 0, delay: 0.4 } },
              dentro: { y: '0%', scale: 1, opacity: 1, transition: { ...MOLA_ENTRADA, delay } },
            }}
            // menos movimento: a logo já nasce montada e fica parada
            initial={reduzido || !desdeFora ? false : 'fora'}
            animate={montada || reduzido ? 'dentro' : 'fora'}
          >
            <Peca className="block w-full overflow-visible" brilho={false} />
          </motion.span>
        )
      })}
    </span>
  )
}

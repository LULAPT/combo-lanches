import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { formatarPreco } from '@/data/cardapio'
import { useCardapio } from '@/hooks/useCardapio'
import SecaoEmpilhada from '@/components/SecaoEmpilhada'
import TituloSecao from '@/components/TituloSecao'
import MiniBurger from '@/components/burger/MiniBurger'
import BotaoAdicionar from '@/components/BotaoAdicionar'
import ArvoreBurgers from '@/components/ArvoreBurgers'

/* ============================================================================
   OS BURGERS — segunda camada da pilha
   ----------------------------------------------------------------------------
   Os cinco hambúrgueres da casa, cada um DESENHADO com as camadas que a
   descrição dele lista. O X-Tudo Artesanal é visivelmente mais alto que o
   Hambúrguer simples — o cardápio vira a ilustração.

   DUAS COMPOSIÇÕES (o conceito do Pinterest que você mandou):

   desktop  → zigue-zague em cascata, como os pratos da referência: burger
              de um lado, texto do outro, alternando, cada linha subindo um
              pouco por cima da anterior. Passar o mouse abre o burger.
              Pelo meio desce uma ÁRVORE (ArvoreBurgers.jsx) com um galho
              apontando pra cada burger, que ganha cor conforme a rolagem —
              é por ela que o vão entre burger e texto é largo (gap-24).

   celular  → grade de 2 colunas assimétrica: quatro cards compactos e o
              último (o mais completo) atravessando as duas colunas. O
              burger abre sozinho quando o card passa pelo MEIO da tela —
              no celular não existe hover, então quem abre é a rolagem.
   ========================================================================== */

const EASE = [0.16, 1, 0.3, 1]

// o número gigante de cada linha (as duas cópias usam o mesmo)
const NUMERO = 'pointer-events-none absolute -top-10 font-display text-[9rem] leading-none'

export default function Burgers() {
  const { itens } = useCardapio({ categoria: 'hamburgueres' })
  const listaRef = useRef(null)

  return (
    <SecaoEmpilhada camada={2} id="burgers" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 md:pr-24 md:pl-8 xl:pr-8">
        <TituloSecao
          nota="os cinco da casa"
          titulo="Os burgers"
          link="cardápio completo"
          linkPara="/cardapio"
        />

        {/* ---------------- DESKTOP ----------------
            A árvore mora ao lado da lista, não dentro: <ol> só pode ter
            <li> como filho. Ela fica por baixo (vem antes no DOM, e a lista
            é `relative`), então nenhum traço passa por cima de um burger. */}
        <div className="relative mt-16 hidden md:block">
          <ArvoreBurgers listaRef={listaRef} />
          <ol ref={listaRef} className="relative">
            {itens.map((item, i) => (
              <LinhaZigueZague key={item.id} item={item} indice={i} />
            ))}
          </ol>
        </div>

        {/* ---------------- CELULAR ---------------- */}
        <ul className="mt-10 grid grid-cols-2 gap-3 md:hidden">
          {itens.map((item, i) => (
            <CardCelular
              key={item.id}
              item={item}
              destaque={i === itens.length - 1}
            />
          ))}
        </ul>

        <Link
          to="/cardapio"
          className="mt-6 flex items-center justify-center gap-2 rounded-pill border border-linha py-4
                     font-display text-sm font-semibold tracking-wide text-texto uppercase md:hidden"
        >
          Ver o cardápio completo <ArrowRight size={16} />
        </Link>
      </div>
    </SecaoEmpilhada>
  )
}

/* ----------------------------------------------------------------------------
   DESKTOP: uma linha do zigue-zague
-------------------------------------------------------------------------- */
function LinhaZigueZague({ item, indice }) {
  const [aberto, setAberto] = useState(false)
  const invertida = indice % 2 === 1
  const numero = String(indice + 1).padStart(2, '0')
  const ladoNumero = invertida ? '-right-16' : '-left-16'

  return (
    <motion.li
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, margin: '-12%' }}
      className={`relative grid grid-cols-2 items-center gap-24 ${indice > 0 ? '-mt-4' : ''}`}
      // A cascata: linhas pares puxadas um pouco pra direita, ímpares pra
      // esquerda. É o que faz o conjunto "escorrer" na diagonal em vez de
      // ser uma coluna dura.
      style={{ translate: invertida ? '-3% 0' : '3% 0' }}
    >
      {/* ---- palco do burger ---- */}
      <motion.div
        // a árvore mira aqui: o meio desta caixa é onde a seta aponta
        data-arvore="burger"
        variants={{
          oculto: { opacity: 0, x: invertida ? 70 : -70, rotate: invertida ? 5 : -5 },
          visivel: {
            opacity: 1,
            x: 0,
            rotate: 0,
            transition: { duration: 1, ease: EASE },
          },
        }}
        className={`relative w-[clamp(190px,21vw,260px)] ${
          invertida ? 'order-2 justify-self-start' : 'justify-self-end'
        }`}
      >
        {/* número gigante vazado — em DUAS cópias no mesmo lugar:
            atrás  cinza, por baixo do burger (como sempre foi);
            frente vermelha, por cima dele, escondida.
            Quando a seta da árvore chega neste burger, a ArvoreBurgers
            marca a linha com data-chegou e o CSS troca uma pela outra: a
            de trás some, a da frente aparece subindo de leve. z-index não
            anima (ele pula de um valor pro outro); a troca cruzada é o que
            faz o número parecer "vir pra frente" devagar. */}
        <span aria-hidden="true" className={`numero-atras texto-vazado ${NUMERO} ${ladoNumero}`}>
          {numero}
        </span>
        <Poeira />
        <MiniBurger camadas={item.camadas} aberto={aberto} className="relative" />
        <span aria-hidden="true" className={`numero-frente ${NUMERO} ${ladoNumero}`}>
          {numero}
        </span>
      </motion.div>

      {/* ---- texto ---- */}
      <motion.div
        variants={{
          oculto: { opacity: 0, y: 30 },
          visivel: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.85, delay: 0.12, ease: EASE },
          },
        }}
        className={invertida ? 'order-1 justify-self-end text-right' : ''}
      >
        <h3 className="text-3xl text-acento lg:text-4xl">{item.nome}</h3>
        <p
          className={`mt-3 max-w-[42ch] text-sm leading-relaxed text-texto-suave ${
            invertida ? 'ml-auto' : ''
          }`}
        >
          {item.descricao}
        </p>
        <div
          className={`mt-6 flex items-center gap-5 ${invertida ? 'justify-end' : ''}`}
        >
          <span className="font-display text-3xl font-semibold text-texto tabular-nums">
            {formatarPreco(item.preco)}
          </span>
          <BotaoAdicionar item={item} preco={null} />
        </div>
      </motion.div>
    </motion.li>
  )
}

/* ----------------------------------------------------------------------------
   CELULAR: card da grade de duas colunas
-------------------------------------------------------------------------- */
function CardCelular({ item, destaque }) {
  const [aberto, setAberto] = useState(false)

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`relative overflow-hidden rounded-mordida border border-linha bg-painel ${
        destaque ? 'col-span-2 flex items-center gap-3 p-4' : 'flex flex-col p-3'
      }`}
    >
      {/* "Abre quando passa pelo meio": a margem negativa de 38% em cima e
          embaixo encolhe a área de detecção pra faixa central da tela.
          Fica num elemento separado do <li> porque a Motion tem UMA
          configuração de viewport por elemento — e a do <li> é a entrada,
          que acontece uma vez só (once), enquanto esta liga e desliga. */}
      <motion.div
        onViewportEnter={() => setAberto(true)}
        onViewportLeave={() => setAberto(false)}
        viewport={{ margin: '-38% 0px -38% 0px' }}
        className={destaque ? 'w-[42%] shrink-0' : 'px-1 pt-1'}
      >
        <MiniBurger camadas={item.camadas} aberto={aberto} />
      </motion.div>

      <div className={`flex flex-1 flex-col ${destaque ? '' : 'mt-2'}`}>
        {destaque && (
          <span className="font-script text-lg leading-none text-acento">
            o mais completo
          </span>
        )}
        <h3 className={`leading-tight text-texto ${destaque ? 'text-2xl' : 'text-base'}`}>
          {item.nome}
        </h3>
        {destaque && (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-texto-suave">
            {item.descricao}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-display text-lg font-semibold text-texto tabular-nums">
            {formatarPreco(item.preco)}
          </span>
          <BotaoAdicionar item={item} compacto />
        </div>
      </div>
    </motion.li>
  )
}

/* "Farinha" atrás do burger: o grão do fundo recortado num círculo borrado.
   É a nuvem de farinha/sal em volta dos pratos da referência. */
function Poeira() {
  return (
    <span
      aria-hidden="true"
      className="textura pointer-events-none absolute -inset-[30%] rounded-full opacity-90
                 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-texto)_6%,transparent),transparent)]
                 [mask-image:radial-gradient(closest-side,black_20%,transparent)]"
    />
  )
}

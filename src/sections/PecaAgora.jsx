import { Link } from 'react-router-dom'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { LOJA } from '@/data/cardapio'
import SecaoEmpilhada from '@/components/SecaoEmpilhada'
import IconeInstagram from '@/components/IconeInstagram'
import Grifo from '@/components/Grifo'
import Revelar, { RevelarGrupo } from '@/components/Revelar'

/* ============================================================================
   PEÇA AGORA — última camada da pilha (não gruda: o rodapé vem depois)
   ----------------------------------------------------------------------------
   O "Book your table" da referência: uma chamada grande e as informações
   práticas.

   DUAS COMPOSIÇÕES:
   desktop  → tipografia gigante à esquerda ocupando meia tela, coluna de
              ação à direita (nota manuscrita, botões, informações em lista)
   celular  → tipografia centralizada, informações em três ladrilhos lado a
              lado (ícone em cima, texto curto embaixo) e os botões por
              último, largura total — a ação fica perto do polegar
   ========================================================================== */
export default function PecaAgora() {
  /* Na lista do desktop, o horário e o bairro levam o grifo (pedido do
     Marco): "todo dia às 09:30" e "Caetés I" são o que o cliente procura
     aqui. A lista é o 3º bloco do grupo (surge 180ms depois da chamada),
     e os dois grifos passam um depois do outro, depois do "fecha pelo
     iFood" do parágrafo. */
  const horario = LOJA.fecha ? (
    <Grifo atraso={180}>
      Todo dia, {LOJA.abre} às {LOJA.fecha}
    </Grifo>
  ) : (
    <>
      Abre <Grifo atraso={180}>todo dia às {LOJA.abre}</Grifo>
    </>
  )
  const lugar = (
    <>
      <Grifo atraso={480}>{LOJA.bairro}</Grifo> · {LOJA.municipio} — PE
    </>
  )

  return (
    <SecaoEmpilhada camada={4} id="contato" className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 md:pr-24 md:pl-8 xl:pr-8">
        <RevelarGrupo className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          {/* ---- a chamada ---- */}
          <Revelar className="text-center lg:text-left">
            <h2 className="text-[clamp(3.6rem,17vw,5.5rem)] leading-[0.86] lg:text-[clamp(6rem,11vw,10.5rem)]">
              <span className="block">Bateu</span>
              {/* o "a" na mesma cor do "Bateu" — em cinza (texto-suave) ele
                  parecia de outra frase (Marco) */}
              <span className="block">a</span>
              {/* vermelho chapado — já foi um degradê animado (GradientText
                  do ReactBits), que poluía a seção */}
              <span className="block text-acento">fome?</span>
            </h2>
          </Revelar>

          {/* ---- a ação ---- */}
          <div className="flex flex-col gap-6">
            <Revelar variante="right">
              <p className="text-center font-script text-3xl text-acento lg:text-left lg:text-4xl">
                tá servido?
              </p>
              <p className="mt-2 text-center leading-relaxed text-texto-suave lg:max-w-[40ch] lg:text-left">
                {/* o grifo: é a informação que mais confunde (o site não
                    fecha pedido). atraso 90 = este bloco é o 2º do grupo,
                    surge 90ms depois da chamada */}
                Monta o pedido aqui, <Grifo atraso={90}>fecha pelo iFood da loja</Grifo>.
                Entrega em {LOJA.bairro} e região.
              </p>
            </Revelar>

            {/* informações: ladrilhos no celular, lista no desktop */}
            <Revelar variante="right">
              <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-linha lg:border-y lg:border-linha">
                <Info icone={<Clock size={18} />} texto={horario} curto={`abre ${LOJA.abre}`} />
                <Info icone={<MapPin size={18} />} texto={lugar} curto={LOJA.bairro} />
                <Info
                  icone={<IconeInstagram size={18} />}
                  texto="@combo_l4nches"
                  curto="Instagram"
                  href={LOJA.instagram}
                />
              </ul>
            </Revelar>

            {/* O CARDÁPIO EM EVIDÊNCIA (pedido do Marco): o foco do site é o
                nosso cardápio, e pedir por ele poupa a loja das taxas do
                iFood. Ele vem primeiro, com o botão cheio; o iFood fica ao
                lado, só com o contorno. Os estilos não mudaram de lugar,
                quem trocou foram os dois botões. */}
            <Revelar variante="right" className="flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                to="/cardapio"
                className="botao-primario group flex flex-1 items-center justify-center gap-2 rounded-pill px-6 py-4
                           font-display font-semibold tracking-wide uppercase
                           shadow-(--sombra-botao) transition hover:brightness-110 active:scale-95"
              >
                {/* a seta anda pra direita no hover — a mesma do "Ver o
                    cardápio" da hero */}
                Cardápio <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={LOJA.pedidoExterno}
                target="_blank"
                rel="noreferrer noopener"
                className="flex flex-1 items-center justify-center gap-2 rounded-pill border border-linha px-6 py-4
                           font-display font-semibold tracking-wide text-texto uppercase transition
                           hover:border-texto-suave active:scale-95"
              >
                Pedir no iFood
              </a>
            </Revelar>
          </div>
        </RevelarGrupo>
      </div>
    </SecaoEmpilhada>
  )
}

/* Uma informação. `curto` é o texto do ladrilho do celular (não cabe a
   frase inteira em 90px de largura); `texto` é o da lista do desktop. */
function Info({ icone, texto, curto, href }) {
  const Tag = href ? 'a' : 'div'
  const extras = href ? { href, target: '_blank', rel: 'noreferrer noopener' } : {}

  return (
    <li>
      <Tag
        {...extras}
        className="flex h-full flex-col items-center gap-1.5 rounded-2xl border border-linha bg-painel px-2 py-3
                   text-center text-xs text-texto transition hover:text-acento
                   lg:flex-row lg:gap-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-3.5
                   lg:text-left lg:text-sm"
      >
        <span className="text-acento">{icone}</span>
        <span className="lg:hidden">{curto}</span>
        <span className="hidden lg:inline">{texto}</span>
      </Tag>
    </li>
  )
}

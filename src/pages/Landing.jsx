import Hero from '@/sections/Hero'
import Burgers from '@/sections/Burgers'
import MonteCombo from '@/sections/MonteCombo'
import PecaAgora from '@/sections/PecaAgora'

/* ============================================================================
   LANDING
   ----------------------------------------------------------------------------
   Quatro camadas, cada uma subindo por cima da anterior:

     Hero        a logo que desmonta (+ o trilho de rolagem dela)
     Burgers     os cinco da casa, desenhados camada por camada
     MonteCombo  lanche + acompanhamento + bebida, com total ao vivo
     PecaAgora   o fechamento: chamada, horário, onde fica

   Poucas seções de propósito — a loja tem pouca informação pública, e
   seção esticada pra "encher" é pior que seção nenhuma.

   A mecânica do empilhamento está em SecaoEmpilhada.jsx e no index.css
   (.secao-empilhada). AO ADICIONAR UMA SEÇÃO NOVA:
   1. Use <SecaoEmpilhada camada={N}> com N maior que o da anterior.
   2. Fundo opaco — o .secao-empilhada já põe; se trocar por transparente,
      a seção de baixo aparece atravessando e o efeito quebra.
   3. A ÚLTIMA seção não gruda (o :last-child no CSS cuida disso). Adicionou
      uma depois da PecaAgora? A nova vira a última e a PecaAgora volta a
      grudar sozinha.
   ========================================================================== */
/* PAUSA antes da próxima seção subir. Um vão vazio na pilha: enquanto você
   rola por ele, a seção de cima fica grudada, inteira e parada na tela (o
   fim dela tem tempo de ser visto — o X-Tudo Artesanal nos Burgers, o
   resumo do pedido no Combo), e só depois a próxima começa a cobrir.

   Sem id, não conta como seção pra navegação, mas a altura entra na conta
   de posição (RolagemDeRota e useSecaoAtiva somam todos os filhos da
   .pilha). Com menos movimento não há empilhamento, e a pausa viraria um
   buraco na página: some (motion-reduce:hidden, e leve:hidden no modo
   leve). */
function Pausa() {
  return <div aria-hidden="true" className="h-[40svh] motion-reduce:hidden leve:hidden" />
}

export default function Landing() {
  return (
    <div className="pilha">
      <Hero />
      <Burgers />
      <Pausa />
      <MonteCombo />
      <Pausa />
      <PecaAgora />
    </div>
  )
}

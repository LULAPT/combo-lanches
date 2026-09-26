import MiniBurger from '@/components/burger/MiniBurger'
import Ilustracao, { escalaDe } from '@/components/Ilustracao'
import { alturaFechada } from '@/components/burger/geometria'

/* ============================================================================
   ARTE DO PRODUTO — o desenho de um item, do tamanho da caixa onde ele mora
   ----------------------------------------------------------------------------
   Todo lugar do app que mostra comida passa por aqui: cartões, ladrilhos,
   a bandeja do combo, a sacola e o desenho que voa até ela (voo.jsx).

   A caixa é de quem usa (um ladrilho de 104px, um cartão de 150px…). Aqui
   só se decide o tamanho do desenho DENTRO dela:

     hambúrguer  pela LARGURA, limitada pela altura: um X-Tudo Artesanal
                 (alto, muitas camadas) fica mais estreito que um
                 Hambúrguer simples, e os dois cabem inteiros
     o resto     pela ALTURA relativa do produto de verdade (escalaDe —
                 a lata é baixinha, a garrafa de 2 L é alta), a mesma
                 escala da vitrine do site

   Props:
     item | itemId   o produto (ou só o id — a sacola guarda o id)
     camadas         o burger com os extras que o cliente pediu
     proporcao       largura ÷ altura da caixa (1 = quadrada)
     escala          encolhe tudo (0.8 = 80%)
   ========================================================================== */
export default function ArteProduto({
  item,
  itemId,
  camadas,
  proporcao = 1,
  escala = 1,
  className = '',
}) {
  const id = item?.id ?? itemId
  const pilha = camadas ?? item?.camadas

  if (pilha) {
    // no máximo 80% da largura e 72% da altura da caixa. alturaFechada diz
    // quanto o burger é alto em % da largura DELE.
    const porAltura = (72 / proporcao) * (100 / alturaFechada(pilha))
    const largura = Math.min(80, porAltura) * escala

    return (
      <span className={`block ${className}`} style={{ width: `${largura}%` }}>
        <MiniBurger camadas={pilha} justo />
      </span>
    )
  }

  return (
    <span className={`flex items-end ${className}`} style={{ height: `${escalaDe(id) * escala}%` }}>
      <Ilustracao itemId={id} className="block h-full w-auto overflow-visible" />
    </span>
  )
}

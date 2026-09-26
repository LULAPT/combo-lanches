/* ============================================================================
   CARDÁPIO — COMBO LANCHES
   ----------------------------------------------------------------------------
   Cardápio real, lido do iFood em 22/09/2026. Nomes, descrições e preços
   conferidos item a item.

   Fonte: ifood.com.br/delivery/abreu-e-lima-pe/combo-lanches-caetes-i

   ⚠️  O QUE AINDA FALTA CONFIRMAR COM A LOJA:
   - Horário de fechamento (o iFood só mostra "Abre às 09:30")
   - Quais são os campeões de venda (a loja é nova no iFood, não há esse dado).
     O `maisPedido` abaixo está marcado nos lanches mais caros só pra popular
     a faixa "Mais pedidos" — confirme antes de apresentar.
   - Taxa de entrega (ver TAXA_ENTREGA em CarrinhoDrawer.jsx)

   Quando o back-end existir, este arquivo vira a resposta de um GET /cardapio
   e some daqui — o formato abaixo é justamente o contrato que você vai pedir
   pra eles devolverem. Nenhum componente importa esse arquivo direto: todos
   passam pelo useCardapio(), então a troca é num lugar só.
   ========================================================================== */

// Caetés tem I, II e III — a loja fica no I. Sempre com o número.
const BAIRRO = 'Caetés I'
const MUNICIPIO = 'Abreu e Lima'

export const LOJA = {
  nome: 'Combo Lanches',
  slogan: 'Lanche de verdade',
  bairro: BAIRRO,
  municipio: MUNICIPIO,
  assinatura: `${BAIRRO} · ${MUNICIPIO}`,
  cidade: `${MUNICIPIO} · PE`,
  // Nota: a loja é nova no iFood e ainda não tem avaliação. `null` faz o
  // selo da hero esconder a estrela em vez de mostrar 0,0 ou "undefined".
  nota: null,
  abre: '09:30',
  fecha: null,
  instagram: 'https://www.instagram.com/combo_l4nches/',
  pedidoExterno:
    'https://www.ifood.com.br/delivery/abreu-e-lima-pe/combo-lanches-caetes-i/4540c2d7-fc31-4c32-aa8e-fac3c12477d8',
}

/* TAXA DE ENTREGA: `null` de propósito. O cliente ainda não foi contatado,
   então inventar "R$ 5,00" aqui seria colocar um número falso na frente
   dele na reunião. Com null, a linha de entrega mostra "a combinar" e o
   total é só o subtotal — na gaveta do site (CarrinhoDrawer.jsx) e na
   sacola do app (src/app/telas/Sacola.jsx). Quando souberem o valor real,
   é um número aqui e só. */
export const TAXA_ENTREGA = null

/* As categorias aparecem nesta ordem na faixa horizontal do cardápio.
   O ícone de cada uma fica no Cardapio.jsx (ícone é visual, não dado). */
export const CATEGORIAS = [
  {
    id: 'hamburgueres',
    nome: 'Hambúrgueres',
    chamada: 'Do clássico ao artesanal',
  },
  {
    id: 'acompanhamentos',
    nome: 'Acompanhamentos',
    chamada: 'Pra completar o combo',
  },
  {
    id: 'bebidas',
    nome: 'Bebidas',
    chamada: 'Geladas, do 200ml ao 2 litros',
  },
]

/* ----------------------------------------------------------------------------
   ADICIONAIS
   No iFood eles são uma categoria solta do catálogo. Aqui viram opções
   configuráveis do item, que é o que o PDF pede na tela de "Detalhe do item"
   (seção 04): lista de opções com quantidade e limites.

   `max: 3` é um limite nosso, não da loja — evita o pedido de 40 bacons por
   engano. Ajuste quando o cliente disser qual é a regra real.

   `camada` é o desenho que o adicional acrescenta no burger (ver
   src/components/burger/camadas.jsx). Pôr +2 bacon no modal faz duas tiras
   de bacon aparecerem no desenho do lanche.
-------------------------------------------------------------------------- */
export const ADICIONAIS = [
  { id: 'carne-artesanal', nome: 'Carne artesanal', preco: 11.2, max: 3, camada: 'carne' },
  { id: 'cheddar', nome: 'Queijo cheddar fatiado', preco: 3.99, max: 3, camada: 'cheddar' },
  { id: 'mussarela', nome: 'Queijo mussarela fatiado', preco: 3.99, max: 3, camada: 'queijo' },
  { id: 'bacon', nome: 'Bacon', preco: 3.99, max: 3, camada: 'bacon' },
  { id: 'molho-caseiro', nome: 'Molho caseiro', preco: 3.0, max: 3, camada: 'molho' },
  { id: 'calabresa', nome: 'Calabresa', preco: 2.8, max: 3, camada: 'calabresa' },
]

/* ----------------------------------------------------------------------------
   ITENS
   `maisPedido` alimenta a faixa "Mais pedidos" no topo do cardápio.
   `adicionais: false` desliga a seção de adicionais no modal (bebida não
   leva bacon). As batatas ACEITAM adicionais (cheddar e bacon em batata é
   comum), mas isso é suposição nossa — confirmar com a loja.

   `camadas` (só nos hambúrgueres) é o recheio de cima pra baixo, SEM os
   pães — eles entram sozinhos. Montado lendo a descrição do iFood de cada
   um: se a descrição diz "ovo, bacon, calabresa", o desenho tem ovo, bacon
   e calabresa. Ketchup e molho caseiro viram uma camada só de molho.
   Cremes (creme de cheddar, "cheddar cremoso") viram cheddar.
-------------------------------------------------------------------------- */
export const ITENS = [
  /* ---------------- HAMBÚRGUERES ---------------- */
  {
    id: 'hamburguer',
    categoria: 'hamburgueres',
    camadas: ['salada', 'carne', 'molho'],
    nome: 'Hambúrguer',
    descricao:
      'Um clássico irresistível com carne tradicional, salada fresca, ketchup e molho caseiro, perfeito para quem busca sabor e simplicidade.',
    preco: 9.7,
  },
  {
    id: 'x-burguer',
    categoria: 'hamburgueres',
    camadas: ['salada', 'queijo', 'carne', 'molho'],
    nome: 'X-Burguer',
    descricao:
      'Delicie-se com carne tradicional, queijo mussarela derretido, salada crocante, ketchup e molho caseiro, uma combinação que nunca falha.',
    preco: 11.5,
  },
  {
    id: 'x-tudo',
    categoria: 'hamburgueres',
    camadas: ['salada', 'ovo', 'bacon', 'queijo', 'carne', 'calabresa', 'molho'],
    nome: 'X-Tudo',
    descricao:
      'Experimente o máximo de sabor com carne tradicional, queijo mussarela, ovo, bacon, calabresa, cheddar cremoso, salada, ketchup e molho caseiro.',
    preco: 12.5,
    maisPedido: true,
  },
  {
    id: 'x-burguer-artesanal',
    categoria: 'hamburgueres',
    camadas: ['salada', 'cebola', 'cheddar', 'carne', 'molho'],
    nome: 'X-Burguer Artesanal',
    descricao:
      'Saboreie a perfeição artesanal com carne especial, cheddar fatiado, creme de cheddar, salada, cebola caramelizada, ketchup e molho caseiro.',
    preco: 18.0,
    maisPedido: true,
  },
  {
    id: 'x-tudo-artesanal',
    categoria: 'hamburgueres',
    camadas: ['salada', 'cebola', 'ovo', 'bacon', 'cheddar', 'carne', 'calabresa', 'molho'],
    nome: 'X-Tudo Artesanal',
    descricao:
      'Uma explosão de sabores artesanais com carne especial, cheddar fatiado, creme de cheddar, ovo, bacon, calabresa, salada, cebola caramelizada, ketchup e molho caseiro.',
    preco: 20.99,
    maisPedido: true,
  },

  /* ---------------- ACOMPANHAMENTOS ---------------- */
  {
    id: 'batata-350',
    categoria: 'acompanhamentos',
    nome: 'Batata Frita 350g',
    descricao: 'Porção de batata frita crocante.',
    preco: 13.99,
  },
  {
    id: 'batata-completa',
    categoria: 'acompanhamentos',
    nome: 'Batata Frita Completa',
    descricao: 'Batata frita com os acompanhamentos da casa.',
    preco: 16.9,
    maisPedido: true,
  },
  {
    id: 'coxinha',
    categoria: 'acompanhamentos',
    nome: 'Coxinha',
    descricao: 'Salgado frito na hora.',
    preco: 9.7,
    // os adicionais do iFood são de lanche — bacon em coxinha não existe
    adicionais: false,
  },
  {
    id: 'mini-pizza',
    categoria: 'acompanhamentos',
    nome: 'Mini Pizza',
    descricao: 'Porção individual.',
    preco: 9.0,
    // os adicionais do iFood são de lanche — bacon em mini pizza não existe
    adicionais: false,
  },
  {
    id: 'fatia-bolo',
    categoria: 'acompanhamentos',
    nome: 'Fatia de Bolo',
    descricao: 'Para fechar a conta com doce.',
    preco: 8.5,
    // os adicionais do iFood são de lanche — bacon em fatia de bolo não existe
    adicionais: false,
  },

  /* ---------------- BEBIDAS ---------------- */
  {
    id: 'agua',
    categoria: 'bebidas',
    nome: 'Água Mineral',
    descricao: '500 ml.',
    preco: 2.8,
    adicionais: false,
  },
  {
    id: 'agua-gas',
    categoria: 'bebidas',
    nome: 'Água com Gás',
    descricao: 'Garrafa.',
    preco: 4.2,
    adicionais: false,
  },
  {
    id: 'suco',
    categoria: 'bebidas',
    nome: 'Suco de Fruta',
    descricao: '250 ml.',
    preco: 4.2,
    adicionais: false,
  },
  {
    id: 'h2o',
    categoria: 'bebidas',
    nome: 'H2O',
    descricao: 'Gelado.',
    preco: 6.99,
    adicionais: false,
    maisPedido: true,
  },
  {
    id: 'antarctica-200',
    categoria: 'bebidas',
    nome: 'Antarctica Garrafinha',
    descricao: '200 ml.',
    preco: 4.2,
    adicionais: false,
  },
  {
    id: 'pepsi-200',
    categoria: 'bebidas',
    nome: 'Pepsi Garrafinha',
    descricao: '200 ml.',
    preco: 4.2,
    adicionais: false,
  },
  {
    id: 'coca-200',
    categoria: 'bebidas',
    nome: 'Coca-Cola Garrafinha',
    descricao: '200 ml.',
    preco: 5.5,
    adicionais: false,
  },
  {
    id: 'coca-lata',
    categoria: 'bebidas',
    nome: 'Coca-Cola Lata',
    descricao: '350 ml.',
    preco: 6.9,
    adicionais: false,
  },
  {
    id: 'fanta-lata',
    categoria: 'bebidas',
    nome: 'Fanta Lata',
    descricao: '350 ml.',
    preco: 6.9,
    adicionais: false,
  },
  {
    id: 'antarctica-350',
    categoria: 'bebidas',
    nome: 'Antarctica',
    descricao: '350 ml.',
    preco: 6.9,
    adicionais: false,
  },
  {
    id: 'coca-1l',
    categoria: 'bebidas',
    nome: 'Coca-Cola 1 L',
    descricao: 'Garrafa de 1 litro.',
    preco: 9.8,
    adicionais: false,
  },
  {
    id: 'fanta-1l',
    categoria: 'bebidas',
    nome: 'Fanta 1 L',
    descricao: 'Garrafa de 1 litro.',
    preco: 9.8,
    adicionais: false,
  },
  {
    id: 'antarctica-1l',
    categoria: 'bebidas',
    nome: 'Antarctica 1 L',
    descricao: 'Garrafa de 1 litro.',
    preco: 9.8,
    adicionais: false,
  },
  {
    id: 'pepsi-1l',
    categoria: 'bebidas',
    nome: 'Pepsi 1 L',
    descricao: 'Garrafa de 1 litro.',
    preco: 9.8,
    adicionais: false,
  },
  {
    id: 'coca-pet-1l',
    categoria: 'bebidas',
    nome: 'Coca-Cola Pet 1 L',
    descricao: 'Garrafa pet de 1 litro.',
    preco: 11.0,
    adicionais: false,
  },
  {
    id: 'antarctica-2l',
    categoria: 'bebidas',
    nome: 'Antarctica 2 L',
    descricao: 'Garrafa de 2 litros.',
    preco: 13.99,
    adicionais: false,
  },
  {
    id: 'fanta-2l',
    categoria: 'bebidas',
    nome: 'Fanta 2 L',
    descricao: 'Garrafa de 2 litros.',
    preco: 13.99,
    adicionais: false,
  },
  {
    id: 'pepsi-2l',
    categoria: 'bebidas',
    nome: 'Pepsi 2 L',
    descricao: 'Garrafa de 2 litros.',
    preco: 13.99,
    adicionais: false,
  },
  {
    id: 'coca-2l',
    categoria: 'bebidas',
    nome: 'Coca-Cola 2 L',
    descricao: 'Garrafa de 2 litros.',
    preco: 16.8,
    adicionais: false,
  },
]

/* ----------------------------------------------------------------------------
   CAMADAS DO PEDIDO
   O desenho de um lanche JÁ com os adicionais que o cliente escolheu.
   Os extras entram logo acima do molho (a última camada), que é onde a
   gente enfia coisa num lanche na vida real — e se não houver molho, no
   fim da pilha. Devolve null pra quem não é hambúrguer (bebida, coxinha):
   o <Ilustracao> desenha esses pelo id do item.
-------------------------------------------------------------------------- */
export function camadasDoPedido(item, adicionais = {}) {
  if (!item?.camadas) return null

  const extras = Object.entries(adicionais).flatMap(([id, qtd]) => {
    const camada = ADICIONAIS.find((a) => a.id === id)?.camada
    return camada ? Array(qtd).fill(camada) : []
  })

  const pilha = [...item.camadas]
  const posMolho = pilha.lastIndexOf('molho')
  pilha.splice(posMolho === -1 ? pilha.length : posMolho, 0, ...extras)
  return pilha
}

/* Formatador de moeda — uma instância só, reaproveitada.
   Criar um Intl.NumberFormat dentro do render de cada card custa caro:
   é a parte mais lenta da API de i18n e roda a cada re-render. */
const formatadorBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatarPreco = (valor) => formatadorBRL.format(valor)

# Combo Lanches — guia do repositório

Site + app de cardápio com sacola para a **Combo Lanches** (Caetés I, Abreu e
Lima — PE). React 19 + Vite 8 + Tailwind v4 + Motion. Sem back-end:
"Finalizar pedido" abre um pagamento **simulado** (`Pagamento.jsx` — Pix com
QR falso ou pagar na entrega; nenhuma cobrança real, sem campo de cartão).
Pedido de verdade ainda é pelo iFood da loja, com link na própria tela.

O projeto segue o **Guia de Construção de Interface** que a equipe de
back/design entregou em PDF (`Doc Front-end.pdf`, 16 páginas, na Área de
Trabalho do Marco). As referências a "seção 0X" nos comentários do código
apontam pra ele. Vale ler antes de mexer em tela.

```
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # serve o dist
```

Marco domina HTML, CSS e JS puro e está aprendendo React com este projeto —
há um curso guiado em [AULAS.md](AULAS.md), ancorado nos arquivos reais
daqui. Os comentários do código são densos de propósito e explicam **por
quê**, não **o quê**. Leia o comentário antes de "simplificar" algo que
parece estranho.

## Duas experiências: o SITE e o APP

O mesmo cardápio, a mesma sacola e a mesma marca, com duas caras:

| | Site | App |
|---|---|---|
| Onde | desktop e tablet | celular (< 768px, ou celular deitado) |
| Entrada | `src/Site.jsx` | `src/app/AppCelular.jsx` |
| Cara | landing empilhada, trilho de vidro | abas embaixo, telas curtas |
| Tema padrão | **escuro** | **claro** |
| Letra de título | Oswald em caixa alta | Bricolage Grotesque |

`App.jsx` escolhe pelo `useCelular()` e carrega cada uma com `lazy()` — o
celular nunca baixa o código da landing, e vice-versa. Girar o celular ou
redimensionar a janela troca na hora; a sacola e as preferências moram nos
contextos (`main.jsx`), por fora das duas.

⚠️ A consulta de "é celular" existe **duas vezes**: em `useCelular.js` e no
script inline do `index.html` (que roda antes do React pra pintar o tema
certo no primeiro quadro). Mudou uma, mude a outra.

**Não é "um site responsivo".** O app não é a landing encolhida: é outra
estrutura, com outra navegação. Não tente unificar as duas num JSX só.

## Estrutura

| Caminho | Papel |
|---|---|
| `src/data/cardapio.js` | **Único** lugar com dados da loja, do cardápio e a `TAXA_ENTREGA` |
| `src/hooks/useCardapio.js` | Porta de entrada dos dados — busca, filtro, agrupamento |
| `src/context/` | Carrinho, tema (um por experiência) e modo leve |
| `src/Site.jsx` | Esqueleto do site: trilho, bolha da sacola, gaveta, rotas |
| `src/pages/` | Páginas do site: `Landing.jsx` (monta a pilha) e `Cardapio.jsx` |
| `src/sections/` | As 4 camadas da landing: Hero · Burgers · MonteCombo · PecaAgora |
| `src/app/` | O app do celular — ver abaixo |
| `src/components/` | Peças próprias (a seção 05 do PDF); várias servem aos dois |
| `src/components/burger/` | O burger e a logo vetoriais, camada por camada |
| `src/components/reactbits/` | **Código de terceiros** — ver abaixo |
| `src/index.css` | Temas, paleta do app, scroll empilhado, utilitários |

### O app (`src/app/`)

| Arquivo | Papel |
|---|---|
| `AppCelular.jsx` | Esqueleto: abas montadas, rolagem por aba, a abertura |
| `abas.js` | As 5 abas e os endereços delas; links do site traduzidos |
| `NavInferior.jsx` | Barra de abas; o disco do meio é a logo (leva ao Combo) |
| `telas/` | Início · Cardápio · Combo · Sacola · Loja |
| `FolhaItem.jsx` | Detalhe do produto, sobe de baixo; o produto mora na URL (`?item=`) |
| `produto.jsx` · `ArteProduto.jsx` | Cartões de produto e o desenho encaixado na caixa |
| `voo.jsx` | O desenho que voa até a Sacola quando algo é adicionado |
| `Fileira.jsx` | Fileira de cartões que rola de lado e avisa que rola (seta, fade, espiada) |
| `EscritaGiz.jsx` | O "lanche de verdade" escrito a giz de cera na abertura |
| `sloganManuscrito.js` | **Gerado** por `scripts/gerar-slogan-manuscrito.mjs` — não edite |
| `pecas.jsx` · `animacoes.js` | Cabeçalhos das telas e a entrada em cascata |

## Decisões que não são óbvias

**O cardápio nunca é importado direto.** Toda tela passa por `useCardapio()`.
Quando o back-end existir, a troca por `fetch('/api/cardapio')` acontece dentro
daquele hook e nenhuma página é tocada.

**Um tema por experiência.** `combo-lanches:tema` (site, padrão escuro) e
`combo-lanches:tema-app` (app, padrão claro) no localStorage — trocar no
computador não mexe no celular. O tema é CSS puro: `data-tema="claro"` no
`<html>` troca os tokens; `data-app` liga a paleta própria do app, que
**redefine** os mesmos tokens (fundo, painel, texto, acento…). Por isso as
peças que o app pega emprestadas do site (bandeja, seletor de quantidade,
pagamento) vestem a paleta do app sem saber que ela existe.

**Títulos no app seguem as próprias classes.** O `h1/h2/h3` do site (Oswald
700 em caixa alta) é CSS fora de camada e ganharia de qualquer classe do
Tailwind. No app, um `revert-layer` desfaz isso; título de app usa o
utilitário `titulo-app` (Bricolage).

**Links cruzados.** No site, `/combo`, `/loja` e `/sacola` (endereços do app)
caem na seção equivalente da landing ou abrem a gaveta. No app, `/#combo`,
`/#contato` etc. (âncoras do site) viram a aba certa (`ANCORA_PARA_ABA`).

**Scroll empilhado sem JS (site).** As seções da landing grudam no topo
(`position: sticky`) e a seguinte sobe por cima via `z-index` crescente,
declarado inline em cada `<section>`. A **última** não gruda — o
`.secao-empilhada:last-child` no CSS tira o sticky, senão o rodapé nunca
apareceria. Ao adicionar seção: `className="secao-empilhada"`, `zIndex` maior
que o anterior, e fundo opaco.

**Uma navegação por experiência.** Site: `NavRail.jsx`, o trilho de vidro na
direita, **sem hambúrguer**. App: `NavInferior.jsx`, a barra de abas. O
disco do meio dela (`.disco-marca`) é escuro no tema escuro e esbranquiçado
no claro; a logo lá dentro está no centro ÓTICO (44px, 2px ACIMA do meio
da régua, com `mb-1`) — no centro exato ela parecia puxada pra baixo.
Na aba **Combo**, o disco desce, cresce e pousa no meio da barra (engolindo
o rótulo "Combo") com a logo parada, a barra abre pros lados, e só quando
ele CHEGA a logo se remonta e o "Adicionar combo" sai de trás da barra —
metade pra fora, o disco cobria o botão. Pedido do Marco. O ritmo e a
largura extra são o `COMBO_NA_BARRA` (`app/animacoes.js`), lido pela barra
e pela tela do Combo.

**A sacola tem UM acesso por experiência** (checklist da seção 07: evitar
duplicidade). Site: a `BolhaCarrinho`, que nasce no canto superior esquerdo
quando o primeiro item entra, e abre a `CarrinhoDrawer`. App: a aba Sacola,
com contador e o tranco quando um produto voa até ela. O `Cardapio.jsx` do
site ainda tem a barra fixa inferior — é outra coisa: mostra o total.

**A gaveta do carrinho (site) abre pela DIREITA**, mesmo com a bolha na
esquerda — decisão do Marco (a esquerda foi testada e descartada). O visual
dela é feito só com peças da landing: cabeçalho no molde do `TituloSecao`,
números vazados dos Burgers (`.numero-pedido`), extras anotados em Caveat
vermelho, e no topo a `BandejaPedido` — que usa a **mesma** `CenaBandeja`
do Monte seu Combo (e a Sacola do app também). Mudou a bandeja num, muda
nos outros.

**As abas do app ficam montadas.** Trocar de aba e voltar não apaga nada: a
busca, a categoria, o combo montado e a rolagem continuam onde estavam. A
rolagem é da página (é o que deixa o navegador recolher a barra de
endereço), e cada aba guarda a sua posição.

**A abertura do app** (uma vez por carregamento): a logo se monta grande no
meio da tela (a mesma montagem da hero do site) e, embaixo dela, "lanche
de verdade" se ESCREVE sozinho, letra por letra, com textura de giz de cera
(`EscritaGiz.jsx`) → quando a escrita termina, a barra de abas sobe, com o disco do meio vazio → a logo desce até o disco
(`layoutId="logo-app"` nos dois lugares; a Motion anima a troca como um
voo). As telas só montam quando ela decola. Decisões do Marco: a barra
**só aparece depois** do "carregando"; a escrita a giz é **só na abertura**
(a Caveat do resto do site e do app continua texto normal), e **sem o
desenho de um giz** acompanhando — ele existiu e saiu.

**A escrita a giz** usa as curvas de verdade da Caveat, extraídas por
`scripts/gerar-slogan-manuscrito.mjs` (mudou o texto, rode de novo). Uma
máscara com o contorno de cada letra num traço largo vai revelando a tinta
letra por letra, e a tinta tem um filtro SVG de giz de cera (borda
áspera + falhas da cera). Velocidade e pausas: constantes no topo do
`EscritaGiz.jsx`.

**Ladrilhos de categoria do Início (app).** O texto fica no meio do
ladrilho. No tema **escuro**, em Hambúrgueres e Acompanhamentos, ele desliza
pro topo (`.ladrilho-texto` / `data-sobe` no `index.css`) — as letras
claras em cima do pão e das batatas ficavam estranhas. Bebidas fica no meio
nos dois temas. Decisão do Marco. A subida anima **só transform**
(`translate` + `cqh`), nunca `top`: animar propriedade de layout durante a
troca de tema (uma View Transition, já pesada) fazia a subida engasgar.

**As fileiras que rolam de lado (app) avisam que rolam.** As etapas do
Monte seu combo (5 a 7 opções) e o "Pra começar" do Início: só 2 ou 3
cartões cabem na tela. Quatro dicas, no `app/Fileira.jsx`: a bandeja no
material do disco da barra (`.bandeja-fileira`), a seta na direita (cutuca
4 vezes, leva adiante no toque, some no fim), o fade nas bordas
(`.rolagem-com-fade`) e uma "espiada" única quando a fileira aparece.
Pedido do Marco. Fileira nova de cartões no app? Use a `Fileira`.

**Identidade da linha do carrinho** = id do item + assinatura dos adicionais,
ordenada (`gerarLinhaId`). Sem o `sort()`, escolher {bacon, ovo} e {ovo,
bacon} criaria duas linhas idênticas na tela.

**Preços animados.** `<Preco>` persegue um alvo que muda o tempo todo
(sacola, total da folha do produto) com uma mola — trocar o valor no meio
não reinicia nada.

**Ícones de marca desenhados à mão.** A lucide-react v1 removeu **todos** os
ícones de marca: `import { Instagram } from 'lucide-react'` derruba a página
inteira. Use `IconeInstagram.jsx`. Batata frita também não existe no lucide:
`IconeFritas.jsx`. E o ramo (a seta que desce e vira pra direita, antes do
"5 opções" nos ladrilhos do app, desenhada a partir de um rascunho do
Marco): `IconeRamo.jsx`. Os três têm a mesma API dos ícones do lucide.

**Fontes vêm por `<link>` no `index.html`**, não por `@font-face`. Escrever o
`@font-face` na mão exige acertar a URL do `.woff2` no gstatic, que muda a
cada versão da fonte — e quando muda você ganha um 403 silencioso e a página
cai pro Arial sem avisar. A Bricolage (só do app) está no mesmo link; o
navegador só baixa o arquivo dela quando alguma letra na tela usa.

**Um acento só: o vermelho da logo** (`#F23522` na logo, amostrado dela).
Na interface ele é `--color-acento` (texto e ícone: palavra de destaque,
anotação manuscrita, aba ativa) e `--color-botao` (preenchimento com texto
branco — um degrau mais escuro, pra passar 4,5:1). O amarelo do pão
(`#FCF93A`) é da logo e dos desenhos, não da interface. No app, os fundos
pastel das categorias (`tom-*`) são "a cor da comida", não acento; em cima
deles, só a cor de texto principal (cinza e vermelho pequenos caem pra ~4:1).

## Movimento e o modo leve

`prefers-reduced-motion: reduce` é global desde o dia 1 (fim do `index.css`):
zera durações e transforma o scroll empilhado em rolagem normal.

O **modo leve** é o mesmo "menos movimento", ligado pelo visitante no
interruptor "Animações" (site: último item do trilho; app: Preferências, na
aba Loja). Liga `data-leve` no `<html>`, que:
- repete as regras de menos movimento do CSS (bloco MODO LEVE; mexeu num,
  mexa no outro). Nas classes, a variante `leve:` é o `motion-reduce:` dele;
- faz o `MotionConfig` do `App.jsx` desligar as animações da Motion;
- é lido pelo `useMenosMovimento()`, que junta sistema + interruptor.

**Ao adicionar animação nova:** use `useMenosMovimento()` (nunca o
`useReducedMotion()` sozinho) e confira que ela some nos dois casos.

As fagulhas do clique são o `Fagulhas.jsx` (o ClickSpark do ReactBits
reescrito: o original desenhava 60 vezes por segundo pra sempre, até sem
fagulha na tela).

Foco por teclado: `:focus-visible` com contorno vermelho. Cartões de
produto são `<button>` (ou têm um), nunca `<div onClick>`.

## ReactBits

`src/components/reactbits/` é código de terceiros, instalado por
`npx shadcn@latest add https://reactbits.dev/r/<Nome>-JS-TW`. **Evite editar
esses arquivos** — quem for atualizar depois vai sobrescrever. Precisa mudar o
comportamento? Embrulhe num componente seu (ou reescreva, como o Fagulhas).

Em uso hoje: `Magnet` e `ScrollVelocity`, os dois na hero do site.
Instalados e sem uso: `Aurora` (WebGL, `ogl`), `SplitText` e
`AnimatedContent` (GSAP), `RotatingText`, `ClickSpark`, `CountUp`,
`SpotlightCard`.

⚠️ `ScrollVelocity` é **export nomeado** (`import { ScrollVelocity }`); todos
os outros são default.

## Pendências antes de mostrar ao cliente

- [ ] **Logo.** Hoje é uma recriação vetorial (`Logo.jsx` + `burger/`
      `pecasLogo.jsx`), montada a partir da logo do iFood. Confirmar com o
      cliente — ou trocar pelo arquivo oficial quando chegar.
- [ ] **Horário de fechamento.** `LOJA.fecha` está `null`; os componentes já
      escondem a informação em vez de mostrar "às null".
- [ ] **Avaliação.** `LOJA.nota` está `null` (loja nova no iFood, sem nota).
- [ ] **Taxa de entrega.** `TAXA_ENTREGA` em `data/cardapio.js` está `null`
      e a linha mostra "a combinar" (na gaveta do site e na sacola do app).
- [ ] **Campeões de venda.** As marcas `maisPedido` em `cardapio.js`
      (alimentam o "Pra começar") são chute — a loja é nova e não há dado.
- [ ] **Textos de chamada.** "Bateu a fome?", "Lanche do seu jeito.", as
      notas manuscritas etc. foram escritos por nós, a partir do que dá pra
      afirmar lendo o cardápio. Não são promessas da loja — validar.
- [ ] **Fotos dos itens.** Hoje são desenhos (`Ilustracao.jsx` e `burger/`).
      Quando chegarem fotos, é trocar a entrada no mapa `DESENHOS` do
      `Ilustracao.jsx` — todos os lugares mudam juntos.
- [ ] **Endereço exato.** Só temos a região.

## Armadilha conhecida

**Animação parece travada ao inspecionar por automação.** GSAP e Motion
dependem de `requestAnimationFrame`, que o navegador congela em aba em
segundo plano. Screenshot tirado por ferramenta numa aba sem foco mostra o
título e os parágrafos parados no estado inicial, e animações que andam aos
saltos. Não é bug — abra a aba de verdade.

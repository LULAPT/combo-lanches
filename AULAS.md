# React, partindo de HTML/CSS/JS puro

Escrito pra você, Marco, olhando pros seus três repositórios. Você já sabe
tudo que importa — DOM, eventos, `IntersectionObserver`, CSS de verdade. React
não é uma linguagem nova, é **uma forma diferente de decidir quando a tela
muda**. Essas aulas são sobre essa diferença, não sobre sintaxe.

Cada aula aponta pra um arquivo real deste projeto. Abra o arquivo ao lado.

---

## Aula 0 — A única ideia que muda tudo

No zoo você escreve assim:

```js
let quantidade = 0

function adicionar() {
  quantidade++
  document.querySelector('#contador').textContent = quantidade   // ← você redesenha
  document.querySelector('#badge').classList.toggle('visivel', quantidade > 0)
}
```

Você guarda o dado **e** é responsável por mandar a tela acompanhar. Todo bug
de "a tela tá mentindo" nasce de um caminho onde você mudou o dado e esqueceu
de atualizar um dos lugares.

Em React você escreve o contrário:

```jsx
const [quantidade, setQuantidade] = useState(0)

return (
  <>
    <span>{quantidade}</span>
    {quantidade > 0 && <Badge />}
    <button onClick={() => setQuantidade(quantidade + 1)}>+</button>
  </>
)
```

Você **descreve como a tela é** para um dado valor, e chama `setQuantidade`.
O React descobre o que mudou no DOM e mexe só naquilo. Você nunca mais escreve
`querySelector` pra atualizar nada.

> **A regra que resume React:** a tela é uma função do estado.
> `tela = f(estado)`. Mudou o estado, o React chama `f` de novo.

Isso tem um preço que assusta no começo: **a função do componente roda
inteira, de novo, a cada mudança**. Não é lento — o React só aplica no DOM a
diferença. Mas significa que código solto dentro do componente roda muitas
vezes. É por isso que existem `useEffect`, `useMemo` e `useRef` (aulas 5 e 9).

---

## Aula 1 — Componente é uma função que devolve marcação

📂 [`src/components/EstadoVazio.jsx`](src/components/EstadoVazio.jsx) — o menor do projeto.

```jsx
export default function EstadoVazio({ emoji, titulo, texto, acao }) {
  return (
    <div className="flex flex-col items-center gap-3 p-16 text-center">
      <span className="text-6xl">{emoji}</span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {acao}
    </div>
  )
}
```

Regras que valem sempre:

- **Nome em maiúscula.** `<estadoVazio />` o React trata como tag HTML e
  ignora. `<EstadoVazio />` ele trata como seu componente. Não é estilo, é
  como o JSX distingue os dois.
- **`className`, não `class`.** `class` é palavra reservada em JS.
- **`{}` abre uma janela pra JavaScript** dentro da marcação. `{emoji}`,
  `{2 + 2}`, `{itens.length}`. Qualquer expressão.
- **Devolve UM elemento.** Precisa de dois lado a lado? Embrulhe em `<>...</>`
  (fragmento, não vira tag no DOM).

### `{acao}` — o truque que você vai usar muito

Repare que `acao` é um **componente inteiro passado como prop**:

```jsx
<EstadoVazio
  titulo="Carrinho vazio"
  acao={<Link to="/cardapio">Ver cardápio</Link>}
/>
```

É isso que deixa o `EstadoVazio` servir tanto pro carrinho quanto pra busca
sem resultado. Ele não sabe qual é o botão — só sabe onde colocá-lo. Em JS
puro o equivalente seria passar uma string de HTML, e aí você perde eventos,
escape e tipagem.

---

## Aula 2 — Props são os `data-*` do React (mas melhores)

📂 [`src/components/SeletorQuantidade.jsx`](src/components/SeletorQuantidade.jsx)

No seu `dither.js` os parâmetros vêm de `data-*`:

```html
<canvas data-dither data-wave-speed="0.05" data-pixel-size="2"></canvas>
```

Em React viram props:

```jsx
<SeletorQuantidade valor={3} min={0} max={5} onMudar={setQtd} />
```

Duas diferenças que importam:

1. **Props não são só string.** `max={5}` é o número 5, `onMudar={setQtd}` é
   uma função de verdade. Com `data-*` você sempre recebe string e faz
   `parseFloat` na mão.
2. **Props são somente leitura.** O componente **nunca** muda a própria prop.
   Se ele precisa avisar que algo mudou, ele chama uma função que veio de
   cima — por isso existe o `onMudar`.

Esse padrão tem nome: **componente controlado**. O `SeletorQuantidade` não
guarda a quantidade. Ele recebe e avisa. Quem guarda é o carrinho. É isso que
garante que o número no modal e o número no carrinho nunca divirjam — só
existe uma cópia do dado.

> **Quando quebrar essa regra:** se o componente tem estado que só interessa a
> ele (um acordeão aberto/fechado), pode guardar internamente. Se o valor
> aparece em outro lugar da tela, ele sobe.

---

## Aula 3 — `useState`, e por que ele parece estranho

```jsx
const [busca, setBusca] = useState('')
```

Lê-se: "crie um estado que começa vazio; me dê o valor atual em `busca` e a
função pra trocar em `setBusca`".

O que confunde vindo de JS puro:

### `setBusca` não muda a variável na hora

```jsx
function aoDigitar(e) {
  setBusca(e.target.value)
  console.log(busca)   // ← ainda o valor ANTIGO
}
```

`busca` é uma constante **daquela execução** da função. O novo valor aparece
na próxima execução, que o React agenda. Se você precisa do valor novo ali
mesmo, use a variável local (`e.target.value`), não o estado.

### Dependendo do valor anterior? Use a forma de função

```jsx
setExpandido((v) => !v)        // ✅ certo
setExpandido(!expandido)       // ⚠️ quebra se duas chamadas caírem no mesmo lote
```

📂 Veja em [`src/components/NavRail.jsx`](src/components/NavRail.jsx) —
`setExpandido((v) => !v)`.

### Objeto e array: copie, não mute

```jsx
adicionais[id] = 2                                  // ❌ o React não vê mudança
setAdicionais({ ...adicionais, [id]: 2 })           // ✅
```

O React compara o valor novo com o antigo por **identidade** (`===`). Se você
mutou o mesmo objeto, os dois lados da comparação são o mesmo objeto, e ele
conclui que nada mudou. Esse é *o* bug nº 1 de quem vem de JS puro.

📂 [`src/components/ModalItem.jsx`](src/components/ModalItem.jsx), função
`mudarAdicional` — repare que ela sempre devolve objeto novo, inclusive na
hora de remover uma chave.

---

## Aula 4 — Listas e a `key`

📂 [`src/pages/Cardapio.jsx`](src/pages/Cardapio.jsx)

```jsx
<ul>
  {grupo.itens.map((item) => (
    <li key={item.id}>
      <CardItem item={item} />
    </li>
  ))}
</ul>
```

`.map()` é o `for` da marcação. Nada de `innerHTML +=`.

A `key` é o que mais dá dor de cabeça, então vale entender de verdade: ela é
**a identidade do item entre dois renders**. O React usa pra decidir se o
terceiro `<li>` de agora é o mesmo terceiro `<li>` de antes ou um item novo.

**Nunca use o índice do array como key** quando a lista pode ser reordenada ou
ter itens removidos. No carrinho, se você usasse `key={i}` e removesse o
primeiro item, o React acharia que o item 0 "virou" o item 1 — e o estado
interno (animação de saída, input aberto) ficaria no elemento errado. Por isso
o carrinho usa `key={linha.linhaId}`.

📂 [`src/context/CarrinhoContext.jsx`](src/context/CarrinhoContext.jsx),
função `gerarLinhaId` — é ela que constrói essa identidade, levando os
adicionais em conta, pra "X-Tudo com bacon" e "X-Tudo sem bacon" serem linhas
diferentes.

### A key como botão de reset

📂 [`src/pages/Cardapio.jsx`](src/pages/Cardapio.jsx), no fim:

```jsx
<ModalItem key={itemAberto?.id} item={itemAberto} ... />
```

Trocar a `key` faz o React **jogar fora o componente e criar outro do zero**.
Todo o estado interno morre junto. É assim que o modal zera os adicionais
escolhidos quando você abre outro lanche — sem uma linha de código de limpeza.
É uma das ferramentas mais úteis e menos conhecidas do React.

---

## Aula 5 — `useEffect`: para falar com o mundo fora do React

`useEffect` é onde vai tudo que **não é** calcular a tela: `addEventListener`,
`localStorage`, `setTimeout`, WebGL, `fetch`.

```jsx
useEffect(() => {
  const aoTeclar = (e) => e.key === 'Escape' && fechar()
  window.addEventListener('keydown', aoTeclar)

  return () => window.removeEventListener('keydown', aoTeclar)   // ← limpeza
}, [aberto, fechar])
```

Três partes:

1. **A função** — roda depois que o React pintou a tela.
2. **A função devolvida** — a *limpeza*. Roda antes do efeito rodar de novo e
   quando o componente sai da tela. **Esquecer isso é o vazamento clássico do
   React.**
3. **O array de dependências** — quando o efeito deve rodar de novo.
   - `[]` → só na montagem
   - `[x]` → sempre que `x` mudar
   - sem array → todo render (quase sempre errado, geralmente loop infinito)

📂 [`src/components/CarrinhoDrawer.jsx`](src/components/CarrinhoDrawer.jsx) —
o efeito que trava a rolagem do body. Se ele não devolvesse a limpeza, fechar
o carrinho deixaria a página travada pra sempre.

### O StrictMode roda seus efeitos duas vezes — de propósito

Em desenvolvimento você vai ver coisas acontecendo em dobro no console. Não é
bug do React: ele monta → desmonta → monta cada componente pra **te mostrar**
que um efeito seu não limpa direito. Se algo quebra com o StrictMode ligado,
há um bug real ali. Conserte a limpeza; não desligue o StrictMode.

📂 [`src/main.jsx`](src/main.jsx)

---

## Aula 6 — Context + `useReducer`: o carrinho

📂 [`src/context/CarrinhoContext.jsx`](src/context/CarrinhoContext.jsx) — leia
o arquivo inteiro, ele é comentado linha a linha.

Dois problemas, duas ferramentas:

### Problema 1: passar o carrinho pra todo mundo

A bolha do carrinho, o card do item, o modal e o drawer precisam todos do
carrinho — e estão em profundidades diferentes da árvore. Passar de prop em
prop (*prop drilling*) é insuportável.

**Context** resolve: o `<CarrinhoProvider>` embrulha o app, e qualquer
componente lá dentro chama `useCarrinho()` e recebe o que precisa.

### Problema 2: mudanças espalhadas

Se `adicionar`, `remover` e `alterarQuantidade` cada um mexesse no array do
seu jeito, um bug de carrinho viraria caça ao tesouro.

**`useReducer`** resolve: toda mudança vira uma mensagem que passa por **uma
função só**.

```jsx
dispatch({ tipo: 'ADICIONAR', item, adicionais, quantidade })
```

Só o `reducer` escreve no estado. Quando o carrinho bugar, você sabe onde
olhar. E como o reducer é uma função pura (mesma entrada → mesma saída, sem
efeito colateral), dá pra testar ele sem abrir navegador.

> **`useState` ou `useReducer`?** `useState` pra um valor simples e
> independente. `useReducer` quando várias ações mexem no mesmo dado e
> precisam respeitar regras entre si — exatamente o carrinho.

---

## Aula 7 — Animação declarativa

Essa é a parte que você vai mais gostar, porque é onde o React paga o
investimento pro seu jeito de trabalhar.

📂 [`src/components/Revelar.jsx`](src/components/Revelar.jsx) — o seu
`[data-reveal]` do Lidera360, portado.

No vanilla você fazia: criar o `IntersectionObserver`, adicionar `.in-view`,
calcular `transition-delay` por irmão, lembrar de desconectar o observer.

Em React:

```jsx
<RevelarGrupo>
  <Revelar>primeiro</Revelar>
  <Revelar variante="left">segundo</Revelar>
</RevelarGrupo>
```

O escalonamento vem do pai (`staggerChildren`), não de delay escrito em cada
filho. Adicionar um item no meio não exige renumerar nada.

### As três ferramentas da Motion, e quando usar cada uma

| Ferramenta | Pra quê | No projeto |
|---|---|---|
| `initial` / `animate` | entrada e mudança de estado | [`Hero.jsx`](src/sections/Hero.jsx) |
| `<AnimatePresence>` | animar a **saída** de algo que vai sumir | [`CarrinhoDrawer.jsx`](src/components/CarrinhoDrawer.jsx) |
| `layoutId` | um elemento "voar" de um lugar pro outro | [`NavRail.jsx`](src/components/NavRail.jsx), [`Cardapio.jsx`](src/pages/Cardapio.jsx) |

**`AnimatePresence` merece atenção.** Em JS puro, animar algo saindo é chato:
você precisa segurar o elemento no DOM até a animação acabar e só então
remover. O `AnimatePresence` faz isso — quando você remove o elemento do JSX,
ele mantém no DOM, roda o `exit`, e só aí tira.

**`layoutId` é o truque de "produto caro".** Dois elementos em lugares
diferentes com o mesmo `layoutId` viram, pra Motion, o mesmo elemento mudando
de posição — e ela interpola. É o realce laranja que desliza entre os chips de
categoria. Em CSS puro isso daria umas 60 linhas de cálculo de posição.

### O que NÃO passa pelo React

📂 [`src/components/Preco.jsx`](src/components/Preco.jsx) e
[`src/components/Cabecalho.jsx`](src/components/Cabecalho.jsx)

`useMotionValue`, `useSpring`, `useScroll` e `useTransform` criam valores que a
Motion escreve **direto no DOM**, sem passar por `useState`. Por isso rolar a
página (que muda a opacidade do cabeçalho 60 vezes por segundo) não redesenha
o React nenhuma vez. Se você usasse `useState` no `onScroll`, o app inteiro
re-renderizaria a cada pixel de rolagem.

**Regra:** valor que muda muito rápido e só afeta o visual → MotionValue.
Valor que muda a estrutura da tela → estado.

---

## Aula 8 — Tailwind v4

Você escolheu Tailwind, então: as classes são atalhos de CSS. `p-4` é
`padding: 1rem`, `flex` é `display: flex`. Não tem mágica.

**O que muda na v4 (e é ótimo pra você):** não existe mais
`tailwind.config.js`. O tema mora no CSS, em `@theme`:

📂 [`src/index.css`](src/index.css)

```css
@theme {
  --color-fogo: #f23522;
  --radius-mordida: 1.25rem;
}
```

Isso gera `bg-fogo`, `text-fogo`, `border-fogo`, `rounded-mordida`
automaticamente. É praticamente o `:root` que você já escreve — só que o
Tailwind lê e cria as classes.

**Quando escrever CSS de verdade em vez de classes:** quando a regra é
estrutural e se repete. O scroll empilhado é 6 linhas de CSS
(`.secao-empilhada`) e seriam 12 classes ilegíveis. `@utility` no fim do
`index.css` é como você cria as suas (`vidro`, `gradiente-fogo`, `sem-barra`).

**Não decore classes.** Instale a extensão *Tailwind CSS IntelliSense* no VS
Code e digite `bg-` pra ver a lista com as cores renderizadas.

---

## Aula 9 — `useMemo` e `useRef`, sem mistificação

Lembra da aula 0: a função do componente roda inteira a cada render.

**`useMemo`** guarda o resultado de um cálculo caro entre renders:

```jsx
const { grupos } = useCardapio({ busca, categoria })
```

📂 [`src/hooks/useCardapio.js`](src/hooks/useCardapio.js) — o filtro só roda
de novo quando `busca` ou `categoria` mudam.

> ⚠️ Não saia embrulhando tudo em `useMemo`. Ele tem custo próprio. Use quando
> (a) o cálculo é pesado, ou (b) o resultado é objeto/array que vai virar
> dependência de outro hook — que é o caso do `valor` no CarrinhoContext.

**`useRef`** é uma caixinha que sobrevive entre renders **sem causar render**:

```jsx
const anterior = useRef(quantidadeTotal)
```

📂 [`src/components/BolhaCarrinho.jsx`](src/components/BolhaCarrinho.jsx) — pra
saber se o contador *subiu* (e dar o tranco), precisamos do valor anterior. Se
isso fosse `useState`, guardar o anterior causaria um render que mudaria o
anterior de novo: loop.

`useRef` também guarda elementos do DOM (`<div ref={meuRef}>` → `meuRef.current`).
É o `querySelector` do React — e o único lugar onde você deve tocar o DOM na mão.

---

## Armadilhas que vão te pegar

| Sintoma | Causa | Conserto |
|---|---|---|
| Mudei o array e nada aconteceu | Mutação em vez de cópia | `[...arr, novo]`, `{...obj}` |
| Loop infinito / "Maximum update depth" | `useEffect` sem array de dependência, ou setando estado que é dependência dele | Revise o array |
| "Cannot update a component while rendering" | `setState` chamado durante o render | Mova pro `onClick` ou `useEffect` |
| Lista bagunçada ao remover item | `key={index}` | Use um id estável |
| Coisas acontecendo em dobro no dev | StrictMode | É de propósito — conserte a limpeza do efeito |
| `console.log` mostra valor velho | Closure daquele render | Use a variável local ou `setX(v => ...)` |
| Tudo redesenha ao rolar a página | `useState` no listener de scroll | `useScroll` + `useTransform` |

---

## Exercícios, nesta ordem

Faça no próprio projeto. Cada um leva 10–30 min e usa exatamente uma aula.

1. **Troque um texto.** Abra [`src/sections/Hero.jsx`](src/sections/Hero.jsx) e
   mude as palavras do `RotatingText`. Salve e veja a tela atualizar sozinha.
   *(Aula 1)*

2. **Adicione um pilar.** Em [`src/sections/Pilares.jsx`](src/sections/Pilares.jsx),
   acrescente um quarto objeto no array `PILARES`. Repare que você não tocou no
   JSX — a lista se vira. *(Aula 4)*

3. **Mude a paleta inteira.** Em [`src/index.css`](src/index.css), troque
   `--color-fogo` por um verde. Veja o site inteiro virar. *(Aula 8)*

4. **Adicione uma seção à landing.** Copie a estrutura de
   [`Pilares.jsx`](src/sections/Pilares.jsx), dê `zIndex` maior que 3, e
   coloque antes do `<Contato />` em
   [`src/pages/Landing.jsx`](src/pages/Landing.jsx). *(Aula 1 + o scroll empilhado)*

5. **Ordenação no cardápio.** Adicione um `useState` pra ordenar por preço, e
   um botão que alterna. Dica: mexa em
   [`src/hooks/useCardapio.js`](src/hooks/useCardapio.js), não na página.
   *(Aulas 3 e 9)*

6. **Observação do pedido.** Um `<textarea>` no
   [`ModalItem.jsx`](src/components/ModalItem.jsx) ("sem cebola, por favor")
   que viaje até o carrinho. Você vai precisar mexer no `reducer` e no
   `gerarLinhaId`. *(Aulas 3 e 6)* — este é o mais difícil, e é o que amarra
   tudo.

---

## Quando travar

Pergunte. Sério — é mais rápido do que caçar em tutorial, porque eu conheço
*este* código. Descreva o que você esperava e o que aconteceu, e se tiver
mensagem de erro, cole inteira.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import { CarrinhoProvider } from '@/context/CarrinhoContext'
import { TemaProvider } from '@/context/TemaContext'
import { ModoLeveProvider } from '@/context/ModoLeveContext'
import '@/index.css'

/* ============================================================================
   PONTO DE ENTRADA
   ----------------------------------------------------------------------------
   Ordem dos embrulhos importa:

   StrictMode       → só em desenvolvimento. Monta cada componente DUAS vezes
                      de propósito pra expor efeito sem limpeza. Se você ver
                      algo acontecendo em dobro no console, é isso, e é um
                      aviso de bug real — não desligue o StrictMode, conserte
                      o useEffect.
   BrowserRouter    → precisa estar por fora de tudo que usa Link/useLocation.
   TemaProvider     → por fora do App: o botão de tema, a grade da hero e as
                      fagulhas do clique precisam saber o tema atual.
   ModoLeveProvider → por fora do App: o interruptor "Animações" (trilho e
                      rodapé) e tudo que decide se anima precisam saber dele.
   CarrinhoProvider → por fora do App pra qualquer tela alcançar o carrinho.

   Se um componente usar useTema() ou useCarrinho() FORA desses embrulhos, o
   hook lança um erro de propósito — e o app inteiro fica em branco. Tela
   vazia com só o fundo aparecendo quase sempre é isso: olhe o console.
   ========================================================================== */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TemaProvider>
        <ModoLeveProvider>
          <CarrinhoProvider>
            <App />
          </CarrinhoProvider>
        </ModoLeveProvider>
      </TemaProvider>
    </BrowserRouter>
  </StrictMode>,
)

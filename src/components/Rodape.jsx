import { Link } from 'react-router-dom'
import { LOJA } from '@/data/cardapio'
import Logo from '@/components/Logo'
import IconeInstagram from '@/components/IconeInstagram'

/* ============================================================================
   RODAPÉ — fica FORA da .pilha de propósito. Se entrasse nela, a última
   seção grudaria no topo e ele nunca chegaria a aparecer.

   Links internos são <Link>, não <a href="/#combo">. O <a> faria o navegador
   rolar sozinho até a âncora — e com as seções sticky ele erra (ver
   RolagemDeRota no App.jsx). O <Link> passa pelo React Router, e aí quem
   rola é o nosso código, que sabe fazer a conta certa.
   ========================================================================== */
export default function Rodape() {
  return (
    <footer className="relative z-10 border-t border-linha bg-painel textura px-5 pt-12 pb-24 md:pr-24 md:pb-12 md:pl-8 xl:pr-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Logo className="h-16" />
          <div className="leading-tight">
            <p className="font-display text-2xl font-semibold tracking-wide text-texto uppercase">
              {LOJA.nome}
            </p>
            <p className="font-script text-xl text-acento">{LOJA.slogan.toLowerCase()}</p>
            <p className="mt-1 text-xs text-texto-suave">{LOJA.cidade}</p>
          </div>
        </div>

        <nav
          aria-label="Rodapé"
          className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-texto-suave sm:flex sm:flex-wrap sm:gap-x-6"
        >
          <Link to="/" className="transition hover:text-texto">Início</Link>
          <Link to="/#burgers" className="transition hover:text-texto">Burgers</Link>
          <Link to="/#combo" className="transition hover:text-texto">Monte seu combo</Link>
          <Link to="/cardapio" className="transition hover:text-texto">Cardápio</Link>
          <Link to="/#contato" className="transition hover:text-texto">Onde estamos</Link>
          <a
            href={LOJA.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 transition hover:text-texto"
          >
            <IconeInstagram size={14} /> Instagram
          </a>
        </nav>
      </div>

      <p className="mx-auto mt-10 max-w-6xl border-t border-linha pt-5 text-xs text-texto-suave">
        Cardápio e preços conforme o iFood da loja.
      </p>
    </footer>
  )
}

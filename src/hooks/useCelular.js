import { useSyncExternalStore } from 'react'

/* ============================================================================
   useCelular — é um celular? Então é o APP, não o site.
   ----------------------------------------------------------------------------
   O projeto tem duas experiências (ver App.jsx):
     site   desktop e tablet — a landing empilhada + o cardápio (Site.jsx)
     app    celular — abas embaixo, tema claro por padrão (src/app/)

   "Celular" aqui é:
     - tela com menos de 768px de largura (o `md:` do Tailwind), OU
     - toque + menos de 500px de altura: é o celular DEITADO. Deitado ele
       passa dos 768px de largura, mas continua sendo um celular — sem esta
       segunda condição, girar o aparelho trocava o app pelo site.
   Tablet deitado tem mais de 700px de altura: continua no site.

   ⚠️  A MESMA consulta está escrita no script do index.html (ele roda antes
   do React, pra pintar o tema certo no primeiro quadro). Mudou aqui, mude
   lá também.

   useSyncExternalStore é o jeito do React de ler algo que vive FORA dele
   (aqui, o matchMedia do navegador) sem descompasso: quando a consulta
   muda (girou o celular, redimensionou a janela), todo mundo que usa o
   hook redesenha junto, no mesmo quadro.
   ========================================================================== */
export const CONSULTA_CELULAR = '(max-width: 767px), (pointer: coarse) and (max-height: 500px)'

const consulta = window.matchMedia(CONSULTA_CELULAR)

const assinar = (avisar) => {
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

const ler = () => consulta.matches

export function useCelular() {
  return useSyncExternalStore(assinar, ler)
}

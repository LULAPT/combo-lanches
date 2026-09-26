/* ============================================================================
   ENTRADA DA LOGO — "cai do céu e dá uma fechadona"
   ----------------------------------------------------------------------------
   O pão de cima cai de 160% da própria altura, o de baixo sobe de 220%, e o
   COMBO estoura no meio (de 35% do tamanho). A mola tem quique
   (amortecimento ~0,6): os pães passam um tico do lugar e voltam — é a
   "fechadona".

   Mora aqui porque são DOIS lugares com a mesma animação:
   - a hero (Hero.jsx), quando a página carrega;
   - a logo cinza do trilho aberto (LogoMontando, em Logo.jsx), toda vez
     que o trilho abre.
   Mexeu aqui, os dois mudam juntos.
   ========================================================================== */

export const ENTRADA = {
  topo: { initial: { y: '-160%', opacity: 0 }, delay: 0.2 },
  combo: { initial: { scale: 0.35, opacity: 0 }, delay: 0.42 },
  base: { initial: { y: '220%', opacity: 0 }, delay: 0.3 },
}

export const MOLA_ENTRADA = { type: 'spring', stiffness: 190, damping: 17 }

/* ============================================================================
   A ENTRADA DAS TELAS DO APP
   ----------------------------------------------------------------------------
   Na primeira visita a uma aba, os blocos sobem um depois do outro:
     <motion.div variants={cascata} initial="oculto" animate="visivel">
       <motion.section variants={subir}> … </motion.section>
       <motion.section variants={subir}> … </motion.section>
   O pai (cascata) só marca o ritmo — 70ms entre um bloco e o próximo; quem
   se mexe são os filhos (subir), com mola.

   Moram fora do pecas.jsx porque arquivo de componente que também exporta
   constante perde o Fast Refresh (a página recarrega inteira a cada save).
   ========================================================================== */
export const cascata = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

export const subir = {
  oculto: { opacity: 0, y: 22 },
  visivel: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 28 } },
}

/* ============================================================================
   O COMBO NA BARRA — a entrada da aba Combo
   ----------------------------------------------------------------------------
   Ao entrar no Combo, o disco da logo DESCE da beirada da barra, CRESCE e
   pousa no meio dela, engolindo o rótulo "Combo"; a barra abre pros lados
   pra dar espaço. SÓ ENTÃO o "Adicionar combo" sai de trás da barra — antes,
   o disco (que ficava metade pra fora) cobria um pedaço dele. Pedido do
   Marco. Quem usa: NavInferior.jsx (disco, rótulo, barra) e telas/Combo.jsx
   (o botão), com os mesmos números pra os dois andarem juntos.
   ========================================================================== */
export const COMBO_NA_BARRA = {
  // quanto a barra (e o botão, que acompanha a largura dela) abre pra cada
  // lado, em px
  abre: 7,
  // a mola do disco e da barra: visualDuration é quanto ela LEVA pra chegar
  // (o quique vem depois, sem atrasar quem espera por ela)
  mola: { type: 'spring', visualDuration: 0.45, bounce: 0.3 },
  // quando o botão sai de trás da barra (s): o disco já chegou
  botao: 0.45,
}

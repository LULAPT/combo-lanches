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

/* ============================================================================
   MODO LEVE — as animações pesadas desligadas, por escolha do visitante
   ----------------------------------------------------------------------------
   O interruptor "Animações" (no trilho do desktop e no rodapé do celular,
   logo abaixo do Instagram) liga e desliga isto. Desligado, o site fica
   como fica pra quem pediu "menos movimento" no sistema — a mesma versão
   parada, que já existia e já era testada — e ainda para os laços que
   rodavam sem parar (o letreiro da hero, as fagulhas do clique).

   É o mesmo desenho do TemaContext: quem manda é um atributo no <html>
   (data-leve), que o script inline do index.html já aplica ANTES de o
   React existir. O CSS reage ao atributo sozinho; o React só precisa saber
   o estado pra desenhar o interruptor e pra desligar o que é JavaScript.

   Quem precisa saber "devo animar?" não usa este contexto direto: usa o
   useMenosMovimento(), que junta a escolha daqui com a do sistema.
   ========================================================================== */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CHAVE_STORAGE = 'combo-lanches:leve'

const ModoLeveContext = createContext(null)

const lerDoDocumento = () => document.documentElement.hasAttribute('data-leve')

export function ModoLeveProvider({ children }) {
  const [leve, setLeve] = useState(lerDoDocumento)

  const alternar = useCallback(() => {
    const novo = !lerDoDocumento()
    const html = document.documentElement

    // ligado é a PRESENÇA do atributo (sem valor); desligado, a ausência
    if (novo) html.dataset.leve = ''
    else delete html.dataset.leve

    try {
      if (novo) localStorage.setItem(CHAVE_STORAGE, '1')
      else localStorage.removeItem(CHAVE_STORAGE)
    } catch {
      // aba anônima: funciona, só não sobrevive ao F5
    }

    setLeve(novo)
  }, [])

  const valor = useMemo(() => ({ leve, alternar }), [leve, alternar])

  return <ModoLeveContext value={valor}>{children}</ModoLeveContext>
}

export function useModoLeve() {
  const contexto = useContext(ModoLeveContext)

  if (!contexto) {
    throw new Error('useModoLeve() precisa estar dentro de <ModoLeveProvider>')
  }

  return contexto
}

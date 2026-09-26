import { useLayoutEffect, useRef } from 'react'

/* ============================================================================
   SEÇÃO EMPILHADA
   ----------------------------------------------------------------------------
   Uma camada da pilha da landing. Ela se mede e escreve a própria altura em
   --altura, que o CSS (.secao-empilhada no index.css) usa pra decidir ONDE
   ela gruda:

     menor que a tela → gruda pelo topo
     maior que a tela → rola inteira, e gruda quando a BASE encosta no fim
                        da tela

   Sem essa medição, uma seção alta no celular grudava pelo topo e a parte
   de baixo dela nunca aparecia — a próxima seção cobria antes. (Esse bug
   existia na primeira versão da landing.)

   `camada` é o z-index: cada seção precisa de um maior que a anterior pra
   subir POR CIMA dela.

   useLayoutEffect e não useEffect: ele roda antes do navegador pintar. Com
   useEffect, a primeira pintura sairia com --altura vazio e a seção daria
   um pulo no frame seguinte.
   ========================================================================== */
export default function SecaoEmpilhada({ camada, id, className = '', children, ...resto }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const secao = ref.current
    const medir = () => secao.style.setProperty('--altura', `${secao.offsetHeight}px`)

    medir()
    // ResizeObserver e não 'resize' da janela: a seção muda de altura sem a
    // janela mudar — fonte que carrega atrasada, imagem que chega, conteúdo
    // que expande.
    const observador = new ResizeObserver(medir)
    observador.observe(secao)
    return () => observador.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      className={`secao-empilhada ${className}`}
      style={{ zIndex: camada }}
      {...resto}
    >
      {children}
    </section>
  )
}

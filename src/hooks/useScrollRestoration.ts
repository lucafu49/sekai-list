import { useLayoutEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'

// Guarda y restaura la posición de scroll de un contenedor por cada entrada del
// historial (location.key), imitando lo que hace el navegador en sitios multipágina:
// al volver (atrás/adelante) recupera la posición previa; en una navegación nueva
// arranca desde arriba.
//
// Pensado para el contenedor scrolleable del layout (el <main> con overflow-y: auto),
// que persiste entre navegaciones. Resuelve el scroll de todas las páginas a la vez.
export function useScrollRestoration(ref: RefObject<HTMLElement | null>) {
  const location = useLocation()
  // Mapa key-de-historial → scrollTop. En un ref para sobrevivir a los re-render
  // sin volver a crearse; vive en memoria (se descarta al recargar la página).
  const positions = useRef<Map<string, number>>(new Map())

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const key = location.key

    // Restaura la posición guardada para esta entrada (o el tope si es nueva).
    // Se hace antes de registrar el listener para que este set no se autoguarde.
    el.scrollTop = positions.current.get(key) ?? 0

    // Mientras esta ruta esté activa, registra la última posición de scroll.
    const onScroll = () => { positions.current.set(key, el.scrollTop) }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll) }
  }, [location.key, ref])
}

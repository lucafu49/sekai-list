// Cliente de TanStack Query: caché central de las respuestas de la API.
// Patrón stale-while-revalidate: sirve datos cacheados al instante (sin skeletons al
// volver a una página ya visitada) y revalida contra el backend en segundo plano.

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cuánto tiempo se consideran "frescos" los datos: dentro de esta ventana
      // no se vuelve a pedir al backend (navegar y volver no dispara fetch).
      staleTime: 30_000,
      // Reintentos ante error. 1 alcanza: el backend remoto puede tener un hipo puntual,
      // pero no queremos insistir sobre un 401/500 real.
      retry: 1,
      // No re-fetchear con solo cambiar de pestaña; el WebSocket ya mantiene el feed fresco.
      refetchOnWindowFocus: false,
    },
  },
})

// Claves de caché centralizadas: evita strings sueltos repartidos por la app
// y mantiene consistentes las invalidaciones.
export const queryKeys = {
  users: ['users'] as const,
  topAnimes: ['animes', 'top'] as const,
  reviewsFeed: (size: number) => ['reviews', 'feed', size] as const,
  titles: ['titles'] as const,
  anime: (id: number) => ['anime', id] as const,
  reviewsByAnime: (id: number) => ['reviews', 'anime', id] as const,
  reviewsByUser: (id: number) => ['reviews', 'user', id] as const,
}

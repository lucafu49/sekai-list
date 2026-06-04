// Cliente para la API pública de Jikan (https://api.jikan.moe/v4)
// Jikan es un wrapper no oficial de MyAnimeList: no requiere auth ni API key,
// tiene CORS habilitado y puede llamarse directo desde el browser.
// Rate limit: ~3 req/s, 60 req/min — el debounce en el componente lo cubre.

const JIKAN_BASE = 'https://api.jikan.moe/v4'

// Máximo de sugerencias a mostrar en el dropdown del modal
const SUGGESTION_LIMIT = 8

// Máximo de géneros a importar por anime (evita ruido con tags como "Award Winning")
const MAX_GENRES = 4

export interface JikanSuggestion {
  malId:    number
  title:    string
  year:     number | null
  imageUrl: string
  genres:   string[]
}

// Busca animes en Jikan por nombre y devuelve sugerencias normalizadas.
// Acepta un AbortSignal para cancelar la request si el usuario sigue escribiendo.
export async function searchJikan(
  query: string,
  signal?: AbortSignal
): Promise<JikanSuggestion[]> {
  if (!query.trim()) return []

  const url =
    `${JIKAN_BASE}/anime` +
    `?q=${encodeURIComponent(query.trim())}` +
    `&limit=${SUGGESTION_LIMIT}` +
    `&sfw=true` +
    `&order_by=popularity`

  const res = await fetch(url, { signal })
  if (!res.ok) return []

  const json = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.data ?? []).map((a: any): JikanSuggestion => ({
    malId:    a.mal_id,
    title:    a.title_english ?? a.title,
    year:     a.year ?? null,
    imageUrl: a.images?.jpg?.image_url ?? '',
    genres:   (a.genres ?? [])
                .slice(0, MAX_GENRES)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((g: any) => g.name as string),
  }))
}

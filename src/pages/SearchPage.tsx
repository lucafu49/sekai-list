import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAnimes } from '../api'
import type { AnimeResponse } from '../api'
import styles from './SearchPage.module.css'

const PAGE_SIZE   = 20
const DEBOUNCE_MS = 350

function initials(name: string): string {
  return name.slice(0, 1).toUpperCase()
}

function ResultCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={`${styles.skeleton} ${styles.skCover}`} />
      <div className={styles.cardInfo}>
        <div className={`${styles.skeleton} ${styles.skName}`} />
      </div>
      <div className={`${styles.skeleton} ${styles.skBadge}`} />
    </div>
  )
}

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''

  const [query,       setQuery]       = useState(initialQ)
  const [animes,      setAnimes]      = useState<AnimeResponse[]>([])
  const [loading,     setLoading]     = useState(false)
  const [hasMore,     setHasMore]     = useState(true)
  const [initialized, setInitialized] = useState(false)

  const loadingRef    = useRef(false)
  const pageRef       = useRef(0)
  const queryRef      = useRef(initialQ)
  const sentinelRef   = useRef<HTMLDivElement>(null)
  const listRef       = useRef<HTMLDivElement>(null)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (q: string, page: number, reset: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const result = await getAnimes({ name: q.trim() || undefined, page, size: PAGE_SIZE })
      setAnimes(prev => reset ? result.content : [...prev, ...result.content])
      setHasMore(!result.last)
      pageRef.current = page
    } catch {
      // fallo silencioso
    } finally {
      loadingRef.current = false
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  // Corre cada vez que el parámetro ?q de la URL cambia (incluso si el componente ya estaba montado).
  // Esto permite que el Navbar navegue a /search?q=nuevo sin remontar la página.
  useEffect(() => {
    setQuery(initialQ)
    queryRef.current = initialQ
    setAnimes([])
    setHasMore(true)
    setInitialized(false)
    fetchPage(initialQ, 0, true)
  }, [initialQ, fetchPage])

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    const list = listRef.current
    if (!sentinel || !list) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        fetchPage(queryRef.current, pageRef.current + 1, false)
      }
    }, { root: list, rootMargin: '100px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, fetchPage])

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  function triggerSearch(value: string) {
    queryRef.current = value
    setAnimes([])
    setHasMore(true)
    setInitialized(false)
    setSearchParams(value ? { q: value } : {}, { replace: true })
    fetchPage(value, 0, true)
  }

  function handleInput(value: string) {
    setQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => triggerSearch(value), DEBOUNCE_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current)
      triggerSearch(query)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isEmpty = initialized && !loading && animes.length === 0

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <p className={styles.subtitle}>Resultados de búsqueda</p>
        <h1 className={styles.heading}>
          {query.trim()
            ? <>"{query}" <span className={styles.count}>· {initialized && !loading ? animes.length : '…'}</span></>
            : 'Todos los títulos'
          }
        </h1>
      </div>

      {/* Input de búsqueda */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar títulos..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
        />
      </div>

      {/* Lista con infinite scroll */}
      <div className={styles.list} ref={listRef}>
        {!initialized && loading
          ? Array.from({ length: 8 }, (_, i) => <ResultCardSkeleton key={i} />)
          : animes.map((anime, i) => (
            <div
              key={anime.idAnime}
              className={styles.card}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => navigate(`/anime/${anime.idAnime}`)}
            >
              {anime.imageUrl
                ? <img src={anime.imageUrl} alt={anime.name} className={styles.cover} />
                : <div className={styles.coverPlaceholder}>{initials(anime.name)}</div>
              }
              <p className={styles.name}>{anime.name}</p>
              <div className={styles.scoreBadge}>
                {anime.averageScore?.toFixed(1) ?? '—'}
                <span className={styles.unit}>/5</span>
              </div>
            </div>
          ))
        }

        {/* Sentinel infinite scroll */}
        <div ref={sentinelRef} />

        {/* Cargando más */}
        {initialized && loading && (
          <div className={styles.spinnerRow}>
            <span className={styles.spinner} />
          </div>
        )}

        {/* Sin resultados */}
        {isEmpty && (
          <p className={styles.emptyText}>
            {query.trim()
              ? `No encontramos resultados para "${query}".`
              : 'No hay animes registrados aún.'
            }
          </p>
        )}
      </div>
    </div>
  )
}

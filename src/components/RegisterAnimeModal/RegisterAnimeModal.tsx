import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { getAnimes } from '../../api'
import type { AnimeResponse } from '../../api/types'
import { AddAnimeModal } from '../AddAnimeModal/AddAnimeModal'
import styles from './RegisterAnimeModal.module.css'

const PAGE_SIZE = 12
const DEBOUNCE_MS = 400

interface RegisterAnimeModalProps {
  onClose: () => void
  onSelectAnime?: (anime: AnimeResponse) => void
}

export function RegisterAnimeModal({ onClose, onSelectAnime }: RegisterAnimeModalProps) {
  const [query, setQuery]     = useState('')
  const [animes, setAnimes]   = useState<AnimeResponse[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const loadingRef  = useRef(false)
  const pageRef     = useRef(0)
  const queryRef    = useRef('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const listRef     = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (q: string, page: number, reset: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const result = await getAnimes({ name: q || undefined, page, size: PAGE_SIZE })
      setAnimes(prev => reset ? result.content : [...prev, ...result.content])
      setHasMore(!result.last)
      pageRef.current = page
    } catch {
      // fallo silencioso — red o token expirado
    } finally {
      loadingRef.current = false
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPage('', 0, true)
  }, [fetchPage])

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    const list = listRef.current
    if (!sentinel || !list) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        fetchPage(queryRef.current, pageRef.current + 1, false)
      }
    }, { root: list, rootMargin: '80px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, fetchPage])

  // ── Escape para cerrar ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Si el modal de agregar está abierto, lo cierra a él, no a este
        if (!addModalOpen) onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, addModalOpen])

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  function triggerSearch(value: string) {
    queryRef.current = value
    setAnimes([])
    setHasMore(true)
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

  // ── Al crear un anime exitosamente ─────────────────────────────────────────
  function handleAnimeCreated(anime: AnimeResponse) {
    setAddModalOpen(false)
    onSelectAnime?.(anime)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isEmpty    = initialized && !loading && animes.length === 0
  const hasResults = animes.length > 0
  const showEndHint = hasResults && !hasMore && !loading

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>¿Qué viste?</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>

          {/* Búsqueda */}
          <div className={styles.searchWrapper}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar títulos..."
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Lista */}
          <div className={styles.list} ref={listRef}>
            {hasResults && animes.map((anime) => (
              <button
                key={anime.idAnime}
                className={styles.item}
                onClick={() => onSelectAnime?.(anime)}
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.name}
                  className={styles.thumbnail}
                  loading="lazy"
                />
                <span className={styles.animeName}>{anime.name}</span>
              </button>
            ))}

            {/* Sentinel para infinite scroll — siempre en el DOM */}
            <div ref={sentinelRef} className={styles.sentinel} />

            {/* Spinner cargando más */}
            {loading && (
              <div className={styles.spinnerRow}>
                <span className={styles.spinner} />
              </div>
            )}

            {/* Sin resultados */}
            {isEmpty && (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>
                  {query
                    ? `"${query}" no está en el catálogo todavía.`
                    : 'No hay animes registrados aún.'}
                </p>
                <button
                  className={styles.registerNewBtn}
                  onClick={() => setAddModalOpen(true)}
                >
                  + Añadir anime al catálogo
                </button>
              </div>
            )}

            {/* Hint al final de la lista cuando ya no hay más resultados */}
            {showEndHint && (
              <div className={styles.endHint}>
                <span className={styles.endHintText}>¿No encontrás lo que buscás?</span>
                <button
                  className={styles.registerNewBtn}
                  onClick={() => setAddModalOpen(true)}
                >
                  + Añadir anime al catálogo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para añadir un anime nuevo */}
      {addModalOpen && (
        <AddAnimeModal
          initialName={query}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAnimeCreated}
        />
      )}
    </>,
    document.body
  )
}

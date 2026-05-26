import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAnimes } from '../../api'
import type { AnimeResponse } from '../../api/types'
import { RegisterAnimeModal } from '../RegisterAnimeModal/RegisterAnimeModal'
import { RateAnimeModal } from '../RateAnimeModal/RateAnimeModal'
import styles from './Navbar.module.css'

const DROPDOWN_SIZE  = 7
const DEBOUNCE_MS    = 350

type Step = 'closed' | 'select' | 'rate'

export function Navbar() {
  const navigate = useNavigate()

  // ── Registro de anime ──────────────────────────────────────────────────────
  const [step, setStep]                   = useState<Step>('closed')
  const [selectedAnime, setSelectedAnime] = useState<AnimeResponse | null>(null)

  function handleSelectAnime(anime: AnimeResponse) {
    setSelectedAnime(anime)
    setStep('rate')
  }

  function handleClose() {
    setStep('closed')
    setSelectedAnime(null)
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<AnimeResponse[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)

  const debounceRef   = useRef<ReturnType<typeof setTimeout>>()
  const wrapperRef    = useRef<HTMLDivElement>(null)
  const latestQuery   = useRef('')

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const page = await getAnimes({ name: q.trim(), page: 0, size: DROPDOWN_SIZE })
      // Descartamos resultados de búsquedas anteriores si el query cambió
      if (q === latestQuery.current) {
        setResults(page.content)
        setOpen(true)
      }
    } catch {
      // fallo silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    latestQuery.current = value
    clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => search(value), DEBOUNCE_MS)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) goToSearch()
    if (e.key === 'Escape') closeDropdown()
  }

  function goToSearch() {
    closeDropdown()
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  function closeDropdown() {
    setOpen(false)
  }

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const showDropdown = open && (loading || results.length > 0)

  return (
    <>
      <header className={styles.navbar}>

        {/* ── Search ── */}
        <div className={styles.searchWrapper} ref={wrapperRef}>
          <Search size={16} strokeWidth={2} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Jujutsu Kaisen, Dragon Ball, Mob Psycho 100..."
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true) }}
            autoComplete="off"
          />

          {showDropdown && (
            <div className={styles.dropdown}>
              {loading && results.length === 0 && (
                <div className={styles.dropdownLoading}>
                  <span className={styles.spinner} />
                </div>
              )}

              {results.map((anime) => (
                <button
                  key={anime.idAnime}
                  className={styles.dropdownItem}
                  onMouseDown={() => {
                    closeDropdown()
                    navigate(`/anime/${anime.idAnime}`)
                  }}
                >
                  {anime.imageUrl
                    ? <img src={anime.imageUrl} alt={anime.name} className={styles.dropdownThumb} />
                    : <div className={styles.dropdownThumbPlaceholder}>
                        {anime.name.slice(0, 1)}
                      </div>
                  }
                  <span className={styles.dropdownName}>{anime.name}</span>
                  <span className={styles.dropdownScore}>
                    {anime.averageScore?.toFixed(1) ?? '—'}
                    <span className={styles.dropdownScoreUnit}>/5</span>
                  </span>
                </button>
              ))}

              {results.length > 0 && (
                <button
                  className={styles.dropdownMore}
                  onMouseDown={goToSearch}
                >
                  <Search size={13} />
                  Ver más resultados para "{query}"
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Log anime ── */}
        <button
          className={styles.logBtn}
          type="button"
          onClick={() => setStep('select')}
        >
          + Registrar anime
        </button>
      </header>

      {step === 'select' && (
        <RegisterAnimeModal
          onClose={handleClose}
          onSelectAnime={handleSelectAnime}
        />
      )}

      {step === 'rate' && selectedAnime && (
        <RateAnimeModal
          anime={selectedAnime}
          onClose={handleClose}
          onBack={() => setStep('select')}
        />
      )}
    </>
  )
}

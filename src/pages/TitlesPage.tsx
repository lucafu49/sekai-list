import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getTitles } from '../api'
import type { TitleResponse } from '../api'
import styles from './TitlesPage.module.css'

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

function TitleCardSkeleton() {
  return (
    <div className={styles.card}>
      <div className={`${styles.skeleton} ${styles.skCover}`} />
      <div className={`${styles.skeleton} ${styles.skName}`} />
      <div className={styles.right}>
        <div className={`${styles.skeleton} ${styles.skAvatars}`} />
        <div className={`${styles.skeleton} ${styles.skCount}`} />
        <div className={`${styles.skeleton} ${styles.skBadge}`} />
      </div>
    </div>
  )
}

export function TitlesPage() {
  const navigate = useNavigate()

  // ── Data (se carga una sola vez) ───────────────────────────────────────────
  const [allTitles, setAllTitles] = useState<TitleResponse[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)

  useEffect(() => {
    getTitles()
      .then(setAllTitles)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // ── Filtros (todos client-side) ────────────────────────────────────────────
  const [nameQuery,   setNameQuery]   = useState('')
  const [sort,        setSort]        = useState<'score' | 'name' | ''>('')
  const [classicOnly, setClassicOnly] = useState(false)

  // ── Filtrado y ordenamiento client-side ────────────────────────────────────
  const displayed = useMemo(() => {
    let result = [...allTitles]

    // Nombre
    if (nameQuery.trim()) {
      const q = nameQuery.trim().toLowerCase()
      result = result.filter(t => t.name.toLowerCase().includes(q))
    }

    // Solo clásicos
    if (classicOnly) {
      result = result.filter(t => t.classic)
    }

    // Ordenamiento
    if (sort === 'score') {
      result.sort((a, b) => (b.circleAverageScore ?? -1) - (a.circleAverageScore ?? -1))
    } else if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [allTitles, nameQuery, classicOnly, sort])

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <p className={styles.subtitle}>Todo lo que tu círculo puntuó</p>
        <h1 className={styles.heading}>
          Títulos
          {!loading && <span className={styles.count}> · {displayed.length}</span>}
        </h1>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filters}>
        {/* Búsqueda por nombre */}
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar título..."
            value={nameQuery}
            onChange={e => setNameQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Ordenar */}
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value as 'score' | 'name' | '')}
        >
          <option value="">Ordenar por...</option>
          <option value="score">Mayor puntuación</option>
          <option value="name">Nombre (A-Z)</option>
        </select>

        {/* Solo clásicos */}
        <button
          className={`${styles.chip} ${classicOnly ? styles.chipActive : ''}`}
          onClick={() => setClassicOnly(v => !v)}
        >
          ★ Clásicos
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>No se pudo cargar el catálogo</p>
          <p className={styles.errorSub}>Revisá tu conexión o intentá recargar la página.</p>
        </div>
      )}

      {/* ── Lista ── */}
      {!error && <div className={styles.list}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => <TitleCardSkeleton key={i} />)
          : displayed.length === 0
            ? <p className={styles.empty}>No hay títulos que coincidan con los filtros.</p>
            : displayed.map((t, i) => {
                const raters = t.ratings.filter(r => r.score !== null).slice(0, 4)
                return (
                  <div
                    key={t.idAnime}
                    className={styles.card}
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => navigate(`/anime/${t.idAnime}`)}
                  >
                    {t.imageUrl
                      ? <img src={t.imageUrl} alt={t.name} className={styles.cover} />
                      : <div className={styles.coverPlaceholder}>{t.name.slice(0, 1)}</div>
                    }

                    <div className={styles.nameCol}>
                      <p className={styles.name}>{t.name}</p>
                      {t.classic && <span className={styles.classicBadge}>CLÁSICO</span>}
                    </div>

                    <div className={styles.right}>
                      {raters.length > 0 && (
                        <div className={styles.avatarStack}>
                          {raters.map((r) => (
                            <div key={r.username} className={styles.avatar} title={r.username}>
                              {initials(r.username)}
                            </div>
                          ))}
                        </div>
                      )}
                      <span className={styles.ratedCount}>
                        {t.circleRatingCount} de {t.totalCircleSize}
                      </span>
                      <div className={styles.scoreBadge}>
                        {t.circleAverageScore?.toFixed(1) ?? '—'}
                        <span className={styles.unit}>/5</span>
                      </div>
                    </div>
                  </div>
                )
              })
        }
      </div>}
    </div>
  )
}

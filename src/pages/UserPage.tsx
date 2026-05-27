import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getUsers, getReviewsByUser } from '../api'
import type { UserResponse, ReviewResponse } from '../api'
import styles from './UserPage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#f4c430',
  '#7c6fcf',
  '#4ade80',
  '#f87171',
  '#60a5fa',
  '#fb923c',
  '#e879f9',
]

function avatarColor(idUser: number): string {
  return AVATAR_COLORS[idUser % AVATAR_COLORS.length]
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return <div className={`${styles.animeCard} ${styles.skeleton}`} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function UserPage() {
  const { userId } = useParams<{ userId: string }>()
  const numId = Number(userId)
  const navigate = useNavigate()

  const [pageUser, setPageUser] = useState<UserResponse | null>(null)
  const [reviews,  setReviews]  = useState<ReviewResponse[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  useEffect(() => {
    if (!numId) return
    setError(false)
    Promise.all([getUsers(), getReviewsByUser(numId)])
      .then(([users, revs]) => {
        setPageUser(users.find(u => u.idUser === numId) ?? null)
        setReviews([...revs].sort((a, b) => b.score - a.score))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [numId])

  // ── Estadísticas ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const count = reviews.length
    const avg   = count > 0
      ? reviews.reduce((s, r) => s + r.score, 0) / count
      : null
    const bangers = reviews.filter(r => r.score >= 4).length
    return { count, avg, bangers }
  }, [reviews])

  const username = pageUser?.username ?? '...'

  if (error) return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2.5} />
        Atrás
      </button>
      <div className={styles.errorState}>
        <p className={styles.errorTitle}>No se pudo cargar el perfil</p>
        <p className={styles.errorSub}>Revisá tu conexión o intentá recargar la página.</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      {/* ── Atrás ── */}
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ChevronLeft size={16} strokeWidth={2.5} />
        Atrás
      </button>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        {pageUser ? (
          <div
            className={styles.avatar}
            style={{ backgroundColor: avatarColor(pageUser.idUser) }}
          >
            {initials(pageUser.username)}
          </div>
        ) : (
          <div className={`${styles.avatar} ${styles.skeleton}`} />
        )}

        <div className={styles.heroInfo}>
          <p className={styles.heroLabel}>{username} profile</p>
          <h1 className={styles.heroUsername}>@{username}</h1>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Puntuados</p>
          <p className={styles.statValue}>
            {loading ? '—' : stats.count}
            <span className={styles.statUnit}> títulos</span>
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Promedio</p>
          <p className={`${styles.statValue} ${styles.statAccent}`}>
            {loading || stats.avg === null ? '—' : stats.avg.toFixed(1)}
            <span className={styles.statUnit}> /5</span>
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>4+ puntajes</p>
          <p className={styles.statValue}>
            {loading ? '—' : stats.bangers}
            <span className={styles.statUnit}> bangers</span>
          </p>
        </div>
      </div>

      {/* ── Grid de ratings ── */}
      <section className={styles.ratingsSection}>
        <h2 className={styles.ratingsTitle}>
          Ratings de @{username}
        </h2>

        <div className={styles.grid}>
          {loading
            ? Array.from({ length: 12 }, (_, i) => <CardSkeleton key={i} />)
            : reviews.length === 0
              ? <p className={styles.empty}>Este usuario todavía no puntuó ningún título.</p>
              : reviews.map(r => (
                  <div
                    key={r.idReview}
                    className={styles.animeCard}
                    onClick={() => navigate(`/anime/${r.animeId}`)}
                  >
                    {r.animeImageUrl
                      ? <img src={r.animeImageUrl} alt={r.animeName} className={styles.cardImg} />
                      : (
                          <div className={styles.cardImgPlaceholder}>
                            {r.animeName.slice(0, 1)}
                          </div>
                        )
                    }
                    <div className={styles.cardOverlay}>
                      <p className={styles.cardName}>{r.animeName}</p>
                      <div className={styles.cardScore}>
                        {r.score.toFixed(1)}
                        <span className={styles.cardScoreUnit}>/5</span>
                      </div>
                    </div>
                  </div>
                ))
          }
        </div>
      </section>
    </div>
  )
}

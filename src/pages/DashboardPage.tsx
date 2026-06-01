import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { getAnimes, getReviews, getUsers } from '../api'
import type { AnimeResponse, ReviewResponse } from '../api'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './DashboardPage.module.css'

function toFive(score: number | null): string {
  if (score === null) return '—'
  return score.toFixed(1)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

function TopCardSkeleton() {
  return (
    <div className={styles.topCard}>
      <div className={styles.leftCol}>
        <span className={`${styles.skeleton} ${styles.skRank}`} />
        <span className={`${styles.skeleton} ${styles.skScore}`} />
      </div>
      <span className={`${styles.skeleton} ${styles.skCover}`} />
      <div className={styles.topInfo}>
        <span className={`${styles.skeleton} ${styles.skLine}`} />
        <span className={`${styles.skeleton} ${styles.skLineShort}`} />
      </div>
    </div>
  )
}

function ReviewCardSkeleton() {
  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <span className={`${styles.skeleton} ${styles.skAvatar}`} />
        <span className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '120px' }} />
        <span className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '60px', marginLeft: 'auto' }} />
      </div>
      <div className={styles.reviewInner}>
        <span className={`${styles.skeleton} ${styles.skInnerCover}`} />
        <span className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '50%', alignSelf: 'center' }} />
        <span className={`${styles.skeleton} ${styles.skCircle}`} style={{ marginLeft: 'auto' }} />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [topAnimes,  setTopAnimes]  = useState<AnimeResponse[]>([])
  const [reviews,    setReviews]    = useState<ReviewResponse[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      getAnimes({ sort: 'score', page: 0 }),
      getReviews({ page: 0, size: 20 }),
      getUsers(),
    ])
      .then(([animePage, reviewPage, users]) => {
        setTopAnimes(animePage.content.slice(0, 3))
        setReviews(reviewPage.content)
        setTotalUsers(users.length)
      })
      .finally(() => setLoading(false))
  }, [])

  // Re-pide el ranking de mejores puntuados al backend. El promedio global y el
  // orden los calcula el servidor (sort=score), así que ante cualquier alta, edición
  // o borrado de review re-consultamos en vez de intentar recalcular en el cliente
  // (el mensaje del WS trae una sola review, insuficiente para reordenar el ranking).
  function refreshTopAnimes() {
    getAnimes({ sort: 'score', page: 0 })
      .then(animePage => setTopAnimes(animePage.content.slice(0, 3)))
      .catch(() => { /* si falla, el ranking queda con el último valor conocido */ })
  }

  // Recibe en tiempo real nuevas puntuaciones de cualquier miembro del círculo.
  // Si ya existe una review del mismo usuario para el mismo anime, la reemplaza;
  // si no, la agrega al inicio del feed (limitado a 20 entradas).
  useWebSocket<ReviewResponse>('/topic/reviews', (incoming) => {
    setReviews(prev => {
      const filtered = prev.filter(
        r => !(r.userId === incoming.userId && r.animeId === incoming.animeId)
      )
      return [incoming, ...filtered].slice(0, 20)
    })
    refreshTopAnimes()
  })

  // Recibe en tiempo real el borrado de puntuaciones: lo quita del feed y
  // actualiza el ranking (un borrado también puede cambiar el promedio/orden).
  useWebSocket<{ userId: number; animeId: number }>('/topic/reviews/deleted', ({ userId, animeId }) => {
    setReviews(prev => prev.filter(r => !(r.userId === userId && r.animeId === animeId)))
    refreshTopAnimes()
  })

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <TrendingUp size={20} strokeWidth={2} color='var(--color-accent)' />
          Mejores Puntuados
        </h2>
        <div className={styles.topGrid}>
          {loading
            ? Array.from({ length: 3 }, (_, i) => <TopCardSkeleton key={i} />)
            : topAnimes.map((anime, i) => (
              <div
                key={anime.idAnime}
                className={styles.topCard}
                style={{ animationDelay: `${i * 80}ms`, cursor: 'pointer' }}
                onClick={() => navigate(`/anime/${anime.idAnime}`)}
              >
                <div className={styles.leftCol}>
                  <span className={styles.rank}>{i + 1}</span>
                  <span className={styles.score}>
                    {toFive(anime.averageScore)}
                    <span className={styles.scoreUnit}>/5</span>
                  </span>
                </div>
                <img src={anime.imageUrl} alt={anime.name} className={styles.cover} />
                <div className={styles.topInfo}>
                  <p className={styles.animeName}>{anime.name}</p>
                  <p className={styles.ratingCount}>
                    {anime.ratingCount} de {totalUsers} puntuaron
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Últimas Puntuaciones</h2>
        <div className={styles.reviewList}>
          {loading
            ? Array.from({ length: 5 }, (_, i) => <ReviewCardSkeleton key={i} />)
            : reviews.map((review, i) => (
              <div
                key={review.idReview}
                className={styles.reviewCard}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Header: avatar · usuario · puntuó · tiempo */}
                <div className={styles.reviewHeader}>
                  <div className={styles.avatar}>{initials(review.username)}</div>
                  <span className={styles.reviewUser}>{review.username}</span>
                  <span className={styles.reviewVerb}>puntuó</span>
                  {review.createdAt && (
                    <span className={styles.reviewTime}>{timeAgo(review.createdAt)}</span>
                  )}
                </div>

                {/* Inner card: cover · título · score */}
                <div
                  className={styles.reviewInner}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/anime/${review.animeId}`)}
                >
                  {review.animeImageUrl
                    ? <img src={review.animeImageUrl} alt={review.animeName} className={styles.reviewCoverImg} />
                    : <div className={styles.reviewCover}>
                        <span className={styles.reviewCoverInitial}>
                          {review.animeName.slice(0, 1)}
                        </span>
                      </div>
                  }
                  <p className={styles.reviewAnimeName}>{review.animeName}</p>
                  <span className={styles.reviewScore}>
                    {review.score}
                    <span className={styles.scoreUnit}>/5</span>
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}

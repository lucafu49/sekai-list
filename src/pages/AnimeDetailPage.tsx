import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PenLine } from 'lucide-react'
import { getAnime, getReviewsByAnime } from '../api'
import type { AnimeResponse, ReviewResponse } from '../api'
import { ScoreModal } from '../components/ScoreModal/ScoreModal'
import styles from './AnimeDetailPage.module.css'

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

function HeroSkeleton() {
  return (
    <div className={styles.hero}>
      <div className={`${styles.skeleton} ${styles.skCover}`} />
      <div className={styles.heroInfo}>
        <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '110px' }} />
        <div className={`${styles.skeleton} ${styles.skTitle}`} />
        <div className={`${styles.skeleton} ${styles.skTitle}`} style={{ width: '60%', marginTop: 0 }} />
        <div className={`${styles.skeleton} ${styles.skBtn}`} />
      </div>
    </div>
  )
}

function GroupCardSkeleton() {
  return (
    <div className={styles.groupCard}>
      <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '160px' }} />
      <div className={`${styles.skeleton} ${styles.skAvgScore}`} />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={styles.reviewRow}>
          <div className={`${styles.skeleton} ${styles.skAvatar}`} />
          <div className={styles.nameCol}>
            <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '80px' }} />
            <div className={`${styles.skeleton} ${styles.skLine}`} style={{ width: '60px' }} />
          </div>
          <div className={`${styles.skeleton} ${styles.skBar}`} />
          <div className={`${styles.skeleton} ${styles.skBadge}`} />
        </div>
      ))}
    </div>
  )
}

export function AnimeDetailPage() {
  const { animeId } = useParams<{ animeId: string }>()
  const navigate = useNavigate()
  const [anime, setAnime] = useState<AnimeResponse | null>(null)
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!animeId) return
    const id = Number(animeId)
    Promise.all([getAnime(id), getReviewsByAnime(id)])
      .then(([animeData, reviewsData]) => {
        setAnime(animeData)
        setReviews([...reviewsData].sort((a, b) => b.score - a.score))
      })
      .finally(() => setLoading(false))
  }, [animeId])

  function refresh() {
    if (!animeId) return
    const id = Number(animeId)
    Promise.all([getAnime(id), getReviewsByAnime(id)])
      .then(([animeData, reviewsData]) => {
        setAnime(animeData)
        setReviews([...reviewsData].sort((a, b) => b.score - a.score))
      })
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        Volver
      </button>

      {loading ? (
        <>
          <HeroSkeleton />
          <GroupCardSkeleton />
        </>
      ) : anime && (
        <>
          <div className={styles.hero}>
            <div className={styles.coverWrap}>
              {anime.imageUrl
                ? <img src={anime.imageUrl} alt={anime.name} className={styles.cover} />
                : <div className={styles.coverPlaceholder}>
                    <span>{anime.name.slice(0, 1)}</span>
                  </div>
              }
              {anime.classic && (
                <span className={styles.classicBadge}>CLÁSICO</span>
              )}
            </div>
            <div className={styles.heroInfo}>
              <span className={styles.groupLabel}>Página del grupo</span>
              <h1 className={styles.title}>{anime.name}</h1>
              <button className={styles.editBtn} onClick={() => setModalOpen(true)}>
                <PenLine size={15} />
                Editar tu puntuación
              </button>
            </div>
          </div>

          <div className={styles.groupCard}>
            <div className={styles.groupHeader}>
              <span className={styles.sectionLabel}>PROMEDIO DEL GRUPO</span>
              <div className={styles.avatarStack}>
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.idReview} className={styles.stackAvatar} title={r.username}>
                    {initials(r.username)}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.avgBlock}>
              <span className={styles.avgScore}>
                {anime.averageScore?.toFixed(1) ?? '—'}
              </span>
              <span className={styles.ratedCount}>
                {anime.ratingCount} puntuaron
              </span>
            </div>

            {reviews.length > 0 && (
              <div className={styles.reviewList}>
                {reviews.map((r, i) => (
                  <div
                    key={r.idReview}
                    className={styles.reviewRow}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={styles.avatar}>{initials(r.username)}</div>
                    <div className={styles.nameCol}>
                      <span className={styles.username}>{r.username}</span>
                      <span className={styles.handle}>@{r.username}</span>
                    </div>
                    <div className={styles.barWrap}>
                      <div
                        className={styles.bar}
                        style={{ width: `${(r.score / 5) * 100}%` }}
                      />
                    </div>
                    <div className={styles.scoreBadge}>
                      {r.score}
                      <span className={styles.unit}>/5</span>
                    </div>
                    <span className={styles.timeAgo}>{timeAgo(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {modalOpen && (
            <ScoreModal
              animeName={anime.name}
              animeId={anime.idAnime}
              currentScore={anime.userScore}
              onClose={() => setModalOpen(false)}
              onSuccess={refresh}
            />
          )}
        </>
      )}
    </div>
  )
}

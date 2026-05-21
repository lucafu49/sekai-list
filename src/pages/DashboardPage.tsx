import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { getAnimes, getReviews } from '../api'
import type { AnimeResponse, ReviewResponse } from '../api'
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

const TOTAL_USERS = 4

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
  const [topAnimes, setTopAnimes] = useState<AnimeResponse[]>([])
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAnimes({ sort: 'score', page: 0 }),
      getReviews({ page: 0, size: 20 }),
    ])
      .then(([animePage, reviewPage]) => {
        setTopAnimes(animePage.content.slice(0, 3))
        setReviews(reviewPage.content)
      })
      .finally(() => setLoading(false))
  }, [])

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
                style={{ animationDelay: `${i * 80}ms` }}
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
                    {anime.ratingCount} de {TOTAL_USERS} puntuaron
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
                <div className={styles.reviewInner}>
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

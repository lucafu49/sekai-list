import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [titles, setTitles] = useState<TitleResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTitles()
      .then(setTitles)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <p className={styles.subtitle}>Todo lo que tu círculo puntuó</p>
        <h1 className={styles.heading}>
          Títulos
          {!loading && <span className={styles.count}> · {titles.length}</span>}
        </h1>
      </div>

      <div className={styles.list}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => <TitleCardSkeleton key={i} />)
          : titles.map((t, i) => {
              const raters = t.ratings.filter(r => r.score !== null).slice(0, 4)
              return (
                <div
                  key={t.idAnime}
                  className={styles.card}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => navigate(`/anime/${t.idAnime}`)}
                >
                  {t.imageUrl
                    ? <img src={t.imageUrl} alt={t.name} className={styles.cover} />
                    : <div className={styles.coverPlaceholder}>
                        {t.name.slice(0, 1)}
                      </div>
                  }

                  <p className={styles.name}>{t.name}</p>

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
      </div>
    </div>
  )
}

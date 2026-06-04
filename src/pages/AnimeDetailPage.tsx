import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PenLine, Trash2, Pencil } from 'lucide-react'
import { getAnime, getReviewsByAnime, deleteReview, deleteAnime } from '../api'
import type { ReviewResponse } from '../api'
import { ScoreModal } from '../components/ScoreModal/ScoreModal'
import { AddAnimeModal } from '../components/AddAnimeModal/AddAnimeModal'
import { useWebSocket } from '../hooks/useWebSocket'
import { queryKeys } from '../queryClient'
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

// ── Modal de confirmación genérico ───────────────────────────────────────────

interface DeleteConfirmProps {
  title: string
  body: React.ReactNode
  confirmLabel?: string
  deleting: boolean
  error?: string
  onCancel: () => void
  onConfirm: () => void
}

function DeleteConfirmModal({
  title,
  body,
  confirmLabel = 'Eliminar',
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmProps) {
  return createPortal(
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.confirmTitle}>{title}</h2>
        <p className={styles.confirmBody}>{body}</p>
        {error && <p className={styles.confirmError}>{error}</p>}
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            Cancelar
          </button>
          <button className={styles.deleteBtn} onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Skeletons ────────────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export function AnimeDetailPage() {
  const { animeId } = useParams<{ animeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(animeId)

  // Datos cacheados por anime: volver a un anime ya visto lo abre al instante.
  const animeQuery = useQuery({
    queryKey: queryKeys.anime(id),
    queryFn: () => getAnime(id),
    enabled: !!animeId,
  })

  // Las reviews se ordenan en `select` (al leer la caché), así el WebSocket puede
  // escribir sin preocuparse por el orden y la lista siempre sale de mayor a menor.
  const reviewsQuery = useQuery({
    queryKey: queryKeys.reviewsByAnime(id),
    queryFn: () => getReviewsByAnime(id),
    enabled: !!animeId,
    select: (data: ReviewResponse[]) => [...data].sort((a, b) => b.score - a.score),
  })

  const anime = animeQuery.data ?? null
  const reviews = reviewsQuery.data ?? []
  const loading = animeQuery.isPending || reviewsQuery.isPending
  const error = animeQuery.isError || reviewsQuery.isError

  // Score modal
  const [scoreOpen, setScoreOpen] = useState(false)

  // Eliminar puntuación
  const [deleteReviewOpen, setDeleteReviewOpen] = useState(false)
  const [deletingReview,   setDeletingReview]   = useState(false)

  // Editar anime
  const [editAnimeOpen, setEditAnimeOpen] = useState(false)

  // Eliminar anime
  const [deleteAnimeOpen,  setDeleteAnimeOpen]  = useState(false)
  const [deletingAnime,    setDeletingAnime]    = useState(false)
  const [deleteAnimeError, setDeleteAnimeError] = useState('')

  // Recibe en tiempo real nuevas puntuaciones para este anime.
  // Si ya existe una review del mismo usuario, la reemplaza (upsert visual);
  // si no, la agrega. La lista se mantiene ordenada de mayor a menor score.
  useWebSocket<ReviewResponse>(
    animeId ? `/topic/reviews/${animeId}` : '',
    (incoming) => {
      queryClient.setQueryData<ReviewResponse[]>(queryKeys.reviewsByAnime(id), (prev = []) => {
        const filtered = prev.filter(r => r.userId !== incoming.userId)
        return [...filtered, incoming]
      })
    }
  )

  // Recibe en tiempo real el borrado de puntuaciones de este anime.
  // El payload es { userId, animeId }; removemos la review de ese usuario.
  useWebSocket<{ userId: number; animeId: number }>(
    animeId ? `/topic/reviews/deleted/${animeId}` : '',
    ({ userId }) => {
      queryClient.setQueryData<ReviewResponse[]>(queryKeys.reviewsByAnime(id), (prev = []) =>
        prev.filter(r => r.userId !== userId)
      )
    }
  )

  // El promedio y la cantidad se derivan de `reviews` en lugar de leerse de
  // `anime`, así se recalculan solos ante cada alta/edición/borrado que llega
  // por WebSocket. Una sola fuente de verdad evita desincronizaciones.
  const ratingCount = reviews.length
  const averageScore = ratingCount > 0
    ? reviews.reduce((sum, r) => sum + r.score, 0) / ratingCount
    : null

  function refresh() {
    if (!animeId) return
    // Re-trae anime (su userScore/promedio cambia al puntuar) y reviews desde el backend.
    queryClient.invalidateQueries({ queryKey: queryKeys.anime(id) })
    queryClient.invalidateQueries({ queryKey: queryKeys.reviewsByAnime(id) })
  }

  async function handleDeleteReview() {
    if (!anime) return
    setDeletingReview(true)
    try {
      await deleteReview(anime.idAnime)
      setDeleteReviewOpen(false)
      refresh()
    } finally {
      setDeletingReview(false)
    }
  }

  async function handleDeleteAnime() {
    if (!anime) return
    setDeletingAnime(true)
    setDeleteAnimeError('')
    try {
      await deleteAnime(anime.idAnime)
      navigate('/titles', { replace: true })
    } catch (err) {
      console.error('Error al eliminar anime:', err)
      setDeleteAnimeError('No se pudo eliminar el anime. Revisá la consola para más detalles.')
      setDeletingAnime(false)
    }
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        Volver
      </button>

      {error ? (
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>No se pudo cargar el anime</p>
          <p className={styles.errorSub}>Revisá tu conexión o intentá recargar la página.</p>
        </div>
      ) : loading ? (
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
              {(anime.year || anime.genres.length > 0) && (
                <div className={styles.meta}>
                  {anime.year && <span className={styles.metaYear}>{anime.year}</span>}
                  {anime.genres.map(g => (
                    <span key={g} className={styles.metaGenre}>{g}</span>
                  ))}
                </div>
              )}

              <div className={styles.btnRow}>
                <button className={styles.editBtn} onClick={() => setScoreOpen(true)}>
                  <PenLine size={15} />
                  {anime.userScore === null ? 'Agregar puntuación' : 'Editar tu puntuación'}
                </button>

                {anime.userScore !== null && (
                  <button
                    className={styles.trashBtn}
                    onClick={() => setDeleteReviewOpen(true)}
                    title="Eliminar puntuación"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className={styles.dangerRow}>
                <button
                  className={styles.editAnimeBtn}
                  onClick={() => setEditAnimeOpen(true)}
                >
                  <Pencil size={13} />
                  Editar anime
                </button>
                <span className={styles.dangerSep}>·</span>
                <button
                  className={styles.deleteAnimeBtn}
                  onClick={() => setDeleteAnimeOpen(true)}
                >
                  <Trash2 size={13} />
                  Eliminar anime
                </button>
              </div>
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
                {averageScore?.toFixed(1) ?? '—'}
              </span>
              <span className={styles.ratedCount}>
                {ratingCount} puntuaron
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

          {/* Modal: editar anime */}
          {editAnimeOpen && (
            <AddAnimeModal
              animeId={anime.idAnime}
              initialName={anime.name}
              initialImageUrl={anime.imageUrl}
              initialClassic={anime.classic}
              initialYear={anime.year}
              initialGenres={anime.genres}
              onClose={() => setEditAnimeOpen(false)}
              onSuccess={(updated) => {
                queryClient.setQueryData(queryKeys.anime(id), updated)
                setEditAnimeOpen(false)
              }}
            />
          )}

          {/* Modal: editar/agregar puntuación */}
          {scoreOpen && (
            <ScoreModal
              animeName={anime.name}
              animeId={anime.idAnime}
              currentScore={anime.userScore}
              onClose={() => setScoreOpen(false)}
              onSuccess={refresh}
            />
          )}

          {/* Modal: eliminar puntuación */}
          {deleteReviewOpen && (
            <DeleteConfirmModal
              title="¿Eliminar puntuación?"
              body={<>Se va a eliminar tu puntuación de <strong>{anime.name}</strong>. Esta acción no se puede deshacer.</>}
              deleting={deletingReview}
              onCancel={() => setDeleteReviewOpen(false)}
              onConfirm={handleDeleteReview}
            />
          )}

          {/* Modal: eliminar anime */}
          {deleteAnimeOpen && (
            <DeleteConfirmModal
              title="¿Eliminar anime?"
              body={<>Se va a eliminar <strong>{anime.name}</strong> del catálogo junto con todas sus puntuaciones. Esta acción no se puede deshacer.</>}
              confirmLabel="Sí, eliminar"
              deleting={deletingAnime}
              error={deleteAnimeError}
              onCancel={() => { setDeleteAnimeOpen(false); setDeleteAnimeError('') }}
              onConfirm={handleDeleteAnime}
            />
          )}
        </>
      )}
    </div>
  )
}

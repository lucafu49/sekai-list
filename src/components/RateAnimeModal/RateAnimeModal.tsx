import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { upsertReview } from '../../api'
import type { AnimeResponse } from '../../api/types'
import { useToast } from '../../context/ToastContext'
import styles from './RateAnimeModal.module.css'

interface RateAnimeModalProps {
  anime: AnimeResponse
  onClose: () => void
  onBack: () => void
  onSuccess?: () => void
}

export function RateAnimeModal({ anime, onClose, onBack, onSuccess }: RateAnimeModalProps) {
  const [score, setScore]           = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const { showToast }               = useToast()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const numericScore = parseFloat(score)
  const isValid = !isNaN(numericScore) && numericScore >= 0.5 && numericScore <= 5

  async function handlePost() {
    if (!isValid) return
    setSubmitting(true)
    setError(null)
    try {
      await upsertReview({ animeId: anime.idAnime, score: numericScore })
      showToast(`Score saved for ${anime.name}!`)
      onSuccess?.()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.animeInfo}>
            <img src={anime.imageUrl} alt={anime.name} className={styles.thumbnail} />
            <span className={styles.animeName}>{anime.name}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Score */}
        <div className={styles.scoreSection}>
          <label className={styles.scoreLabel}>Your score</label>
          <div className={styles.scoreInputWrap}>
            <input
              className={styles.scoreInput}
              type="number"
              min={0.5}
              max={5}
              step={0.1}
              placeholder="0.5 – 5"
              value={score}
              onChange={(e) => { setScore(e.target.value); setError(null) }}
              autoFocus
            />
            <span className={styles.scoreMax}>/5</span>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.changeBtn} onClick={onBack}>
            Change
          </button>
          <button
            className={styles.postBtn}
            onClick={handlePost}
            disabled={!isValid || submitting}
          >
            {submitting ? 'Posting...' : 'Post to Feed'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}

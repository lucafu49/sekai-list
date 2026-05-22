import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { upsertReview } from '../../api'
import styles from './ScoreModal.module.css'

interface ScoreModalProps {
  animeName: string
  animeId: number
  currentScore: number | null
  onClose: () => void
  onSuccess: () => void
}

export function ScoreModal({ animeName, animeId, currentScore, onClose, onSuccess }: ScoreModalProps) {
  const [score, setScore] = useState<number>(currentScore ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit() {
    if (score <= 0 || score > 5) {
      setError('Ingresá una puntuación entre 0.5 y 5.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await upsertReview({ animeId, score })
      onSuccess()
      onClose()
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        <p className={styles.label}>Página del grupo</p>
        <h2 className={styles.animeName}>{animeName}</h2>

        <p className={styles.scoreLabel}>Tu puntuación</p>
        <div className={styles.scoreInputWrap}>
          <input
            className={styles.scoreInput}
            type="number"
            min={0.5}
            max={5}
            step={0.5}
            value={score === 0 ? '' : score}
            placeholder="0.5 – 5"
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (!isNaN(val)) setScore(val)
              else setScore(0)
            }}
          />
          <span className={styles.scoreMax}>/5</span>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Guardando...' : 'Guardar puntuación'}
        </button>
      </div>
    </div>,
    document.body
  )
}

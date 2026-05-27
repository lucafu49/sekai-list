import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ImageIcon } from 'lucide-react'
import { createAnime, updateAnime } from '../../api'
import type { AnimeResponse } from '../../api'
import styles from './AddAnimeModal.module.css'

interface AddAnimeModalProps {
  // Modo edición: si se pasa animeId, se usa updateAnime en lugar de createAnime
  animeId?:       number
  initialName?:   string
  initialImageUrl?: string
  initialClassic?: boolean
  onClose: () => void
  onSuccess: (anime: AnimeResponse) => void
}

export function AddAnimeModal({
  animeId,
  initialName    = '',
  initialImageUrl = '',
  initialClassic  = false,
  onClose,
  onSuccess,
}: AddAnimeModalProps) {
  const isEditMode = animeId !== undefined

  const [name,      setName]      = useState(initialName)
  const [imageUrl,  setImageUrl]  = useState(initialImageUrl)
  const [classic,   setClassic]   = useState(initialClassic)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState('')

  const canSubmit = name.trim().length > 0 && imageUrl.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const data = { name: name.trim(), imageUrl: imageUrl.trim(), classic }
      const anime = isEditMode
        ? await updateAnime(animeId, data)
        : await createAnime(data)
      onSuccess(anime)
    } catch {
      setError(isEditMode
        ? 'No se pudo actualizar el anime. Intentá de nuevo.'
        : 'No se pudo añadir el anime. Intentá de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.headerSub}>{isEditMode ? 'Editar anime' : 'Nuevo anime'}</p>
            <h2 className={styles.title}>{isEditMode ? 'Actualizar datos' : 'Añadir al catálogo'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>

          {/* Nombre */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-name">Nombre</label>
            <input
              id="add-name"
              className={styles.input}
              type="text"
              placeholder="Ej: Fullmetal Alchemist"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* URL de imagen */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-image">URL de imagen</label>
            <div className={styles.inputWrapper}>
              <ImageIcon size={15} className={styles.inputIcon} />
              <input
                id="add-image"
                className={`${styles.input} ${styles.inputWithIcon}`}
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Clásico */}
          <label className={styles.checkRow}>
            <span className={styles.checkLabel}>
              <span className={styles.checkTitle}>Marcar como clásico</span>
              <span className={styles.checkSub}>Se mostrará con el badge CLÁSICO</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={classic}
              className={`${styles.toggle} ${classic ? styles.toggleOn : ''}`}
              onClick={() => setClassic(v => !v)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </label>

          {/* Error */}
          {error && <p className={styles.error}>{error}</p>}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!canSubmit}
            >
              {submitting
                ? (isEditMode ? 'Guardando...' : 'Añadiendo...')
                : (isEditMode ? 'Guardar cambios' : 'Añadir anime')
              }
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  )
}

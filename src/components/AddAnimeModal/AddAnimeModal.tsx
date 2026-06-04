import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ImageIcon, Search } from 'lucide-react'
import { createAnime, updateAnime } from '../../api'
import type { AnimeResponse } from '../../api'
import { searchJikan, type JikanSuggestion } from '../../api/jikan'
import styles from './AddAnimeModal.module.css'

const DEBOUNCE_MS = 350
const MAX_GENRES  = 5

interface AddAnimeModalProps {
  animeId?:        number
  initialName?:    string
  initialImageUrl?: string
  initialClassic?:  boolean
  initialYear?:    number | null
  initialGenres?:  string[]
  onClose:   () => void
  onSuccess: (anime: AnimeResponse) => void
}

export function AddAnimeModal({
  animeId,
  initialName     = '',
  initialImageUrl = '',
  initialClassic  = false,
  initialYear     = null,
  initialGenres   = [],
  onClose,
  onSuccess,
}: AddAnimeModalProps) {
  const isEditMode = animeId !== undefined

  // ── Campos del formulario ────────────────────────────────────────────────────
  const [name,       setName]       = useState(initialName)
  const [imageUrl,   setImageUrl]   = useState(initialImageUrl)
  const [classic,    setClassic]    = useState(initialClassic)
  const [year,       setYear]       = useState<number | ''>(initialYear ?? '')
  const [genres,     setGenres]     = useState<string[]>(initialGenres)
  const [genreInput, setGenreInput] = useState('')

  // ── Submit ───────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const canSubmit = name.trim().length > 0 && imageUrl.trim().length > 0 && !submitting

  // ── Autocompletado Jikan ─────────────────────────────────────────────────────
  const [suggestions,     setSuggestions]     = useState<JikanSuggestion[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [loadingSugg,     setLoadingSugg]     = useState(false)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abortRef     = useRef<AbortController | undefined>(undefined)
  const wrapperRef   = useRef<HTMLDivElement>(null)

  // Cierra el dropdown al hacer click fuera del campo nombre
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleNameInput(value: string) {
    setName(value)

    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (!value.trim()) {
      setSuggestions([])
      setSuggestionsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setLoadingSugg(true)
      try {
        const results = await searchJikan(value, abortRef.current.signal)
        setSuggestions(results)
        setSuggestionsOpen(results.length > 0)
      } catch {
        // AbortError o fallo de red — silencioso
      } finally {
        setLoadingSugg(false)
      }
    }, DEBOUNCE_MS)
  }

  function pickSuggestion(s: JikanSuggestion) {
    setName(s.title)
    setImageUrl(s.imageUrl)
    if (s.year) setYear(s.year)
    if (s.genres.length > 0) setGenres(s.genres.slice(0, MAX_GENRES))
    setSuggestionsOpen(false)
    setSuggestions([])
  }

  // ── Gestión de géneros ───────────────────────────────────────────────────────
  function addGenre(raw: string) {
    const g = raw.trim()
    if (!g || genres.length >= MAX_GENRES) return
    // Comparación case-insensitive para no permitir duplicados como "Drama" y "drama".
    if (genres.some(x => x.toLowerCase() === g.toLowerCase())) return
    setGenres(prev => [...prev, g])
    setGenreInput('')
  }

  function handleGenreKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addGenre(genreInput)
    } else if (e.key === 'Backspace' && genreInput === '' && genres.length > 0) {
      setGenres(prev => prev.slice(0, -1))
    }
  }

  function removeGenre(g: string) {
    setGenres(prev => prev.filter(x => x !== g))
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const data = {
        name:     name.trim(),
        imageUrl: imageUrl.trim(),
        classic,
        year:     year === '' ? null : year,
        genres,
      }
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

          {/* Nombre + dropdown de sugerencias */}
          <div className={styles.field} ref={wrapperRef}>
            <label className={styles.label} htmlFor="add-name">Nombre</label>
            <div className={styles.inputWrapper}>
              <Search size={15} className={`${styles.inputIcon} ${loadingSugg ? styles.inputIconSpin : ''}`} />
              <input
                id="add-name"
                className={`${styles.input} ${styles.inputWithIcon}`}
                type="text"
                placeholder="Ej: Fullmetal Alchemist"
                value={name}
                onChange={e => handleNameInput(e.target.value)}
                autoComplete="off"
              />
            </div>

            {suggestionsOpen && suggestions.length > 0 && (
              <ul className={styles.suggestions}>
                {suggestions.map(s => (
                  <li
                    key={s.malId}
                    className={styles.suggestionItem}
                    onMouseDown={e => { e.preventDefault(); pickSuggestion(s) }}
                  >
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt={s.title} className={styles.suggestionImg} />
                      : <div className={styles.suggestionImgPlaceholder} />
                    }
                    <div className={styles.suggestionInfo}>
                      <span className={styles.suggestionTitle}>{s.title}</span>
                      <span className={styles.suggestionMeta}>
                        {s.year ?? ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
            {/* Preview de la imagen cuando hay URL */}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="preview"
                className={styles.imagePreview}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {/* Año */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-year">Año</label>
            <input
              id="add-year"
              className={styles.input}
              type="number"
              placeholder="2024"
              min={1960}
              max={new Date().getFullYear() + 2}
              value={year}
              onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              autoComplete="off"
            />
          </div>

          {/* Géneros — chips editables */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="add-genre">
              Géneros
              <span className={styles.labelHint}>{genres.length}/{MAX_GENRES}</span>
            </label>
            <div className={styles.chipsWrapper}>
              {genres.map(g => (
                <span key={g} className={styles.chip}>
                  {g}
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => removeGenre(g)}
                    aria-label={`Quitar ${g}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {genres.length < MAX_GENRES && (
                <input
                  id="add-genre"
                  className={styles.chipInput}
                  type="text"
                  placeholder={genres.length === 0 ? 'Ej: Action, Shonen…' : 'Agregar…'}
                  value={genreInput}
                  onChange={e => setGenreInput(e.target.value)}
                  onKeyDown={handleGenreKeyDown}
                  onBlur={() => addGenre(genreInput)}
                  autoComplete="off"
                />
              )}
            </div>
            <p className={styles.fieldHint}>Enter o coma para confirmar cada género</p>
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

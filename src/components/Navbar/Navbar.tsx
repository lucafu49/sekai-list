import { useState } from 'react'
import { Search } from 'lucide-react'
import { RegisterAnimeModal } from '../RegisterAnimeModal/RegisterAnimeModal'
import { RateAnimeModal } from '../RateAnimeModal/RateAnimeModal'
import type { AnimeResponse } from '../../api/types'
import styles from './Navbar.module.css'

type Step = 'closed' | 'select' | 'rate'

export function Navbar() {
  const [step, setStep]                     = useState<Step>('closed')
  const [selectedAnime, setSelectedAnime]   = useState<AnimeResponse | null>(null)

  function handleSelectAnime(anime: AnimeResponse) {
    setSelectedAnime(anime)
    setStep('rate')
  }

  function handleClose() {
    setStep('closed')
    setSelectedAnime(null)
  }

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} strokeWidth={2} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Jujutsu Kaisen, Dragon Ball, Mob Psycho 100..."
            readOnly
          />
        </div>
        <button
          className={styles.logBtn}
          type="button"
          onClick={() => setStep('select')}
        >
          + Registrar anime
        </button>
      </header>

      {step === 'select' && (
        <RegisterAnimeModal
          onClose={handleClose}
          onSelectAnime={handleSelectAnime}
        />
      )}

      {step === 'rate' && selectedAnime && (
        <RateAnimeModal
          anime={selectedAnime}
          onClose={handleClose}
          onBack={() => setStep('select')}
        />
      )}
    </>
  )
}

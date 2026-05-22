import { Search } from 'lucide-react'
import styles from './Navbar.module.css'

export function Navbar() {
  return (
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
      <button className={styles.logBtn} type="button">
        + Registrar anime
      </button>
    </header>
  )
}

// Sidebar de navegación principal de la app.
// Visible en todas las rutas protegidas a través de AppLayout.

import { NavLink, useNavigate } from 'react-router-dom'
import { Rss, Sparkles, User, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import icon from '../../assets/icon.png'
import styles from './Sidebar.module.css'

// Definición centralizada de los ítems de navegación para facilitar agregar rutas en el futuro.
const NAV_ITEMS = [
  { to: '/',        icon: Rss,       label: 'Feed' },
  { to: '/titles',  icon: Sparkles,  label: 'Títulos' },
  { to: '/profile', icon: User,      label: 'Mi perfil' },
]

export function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <img src={icon} alt="SekaiList" className={styles.logo} />
        <span className={styles.brand}>SekaiList</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            // `end` en "/" evita que este ítem quede activo en todas las rutas hijas
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

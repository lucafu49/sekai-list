// Sidebar de navegación principal de la app.
// Visible en todas las rutas protegidas a través de AppLayout.

import { NavLink, useNavigate } from 'react-router-dom'
import { Rss, Sparkles, User, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useUsers } from '../../context/UsersContext'
import icon from '../../assets/icon.png'
import styles from './Sidebar.module.css'

const STATIC_NAV = [
  { to: '/',       icon: Rss,      label: 'Feed' },
  { to: '/titles', icon: Sparkles, label: 'Títulos' },
]

// Paleta de colores para los avatares del círculo
const AVATAR_COLORS = [
  '#f4c430', // dorado (accent)
  '#7c6fcf', // violeta
  '#4ade80', // verde
  '#f87171', // rojo suave
  '#60a5fa', // azul
  '#fb923c', // naranja
  '#e879f9', // rosa
]

function avatarColor(idUser: number): string {
  return AVATAR_COLORS[idUser % AVATAR_COLORS.length]
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { users: circle, myId } = useUsers()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <img src={icon} alt="SekaiList" className={styles.logo} />
        <span className={styles.brand} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>SekaiList</span>
      </div>

      <nav className={styles.nav}>
        {STATIC_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Mi perfil: apunta a /user/:myId una vez que tengamos el id */}
        <NavLink
          to={myId !== undefined ? `/user/${myId}` : '#'}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          <User size={18} strokeWidth={2} />
          <span>Mi perfil</span>
        </NavLink>
      </nav>

      {/* ── Círculo ── */}
      {circle.length > 0 && (
        <div className={styles.circle}>
          <p className={styles.circleTitle}>Tu círculo · {circle.length}</p>
          <ul className={styles.circleList}>
            {circle.map(u => {
              const isMe = user?.username === u.username
              return (
                <li
                  key={u.idUser}
                  className={styles.circleItem}
                  onClick={() => navigate(`/user/${u.idUser}`)}
                >
                  <div
                    className={styles.circleAvatar}
                    style={{ backgroundColor: avatarColor(u.idUser) }}
                  >
                    {initials(u.username)}
                  </div>
                  <div className={styles.circleInfo}>
                    <span className={styles.circleName}>
                      @{u.username}
                      {isMe && <span className={styles.circleYou}> · vos</span>}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className={styles.bottom}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} strokeWidth={2} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

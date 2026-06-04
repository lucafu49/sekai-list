import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { Navbar } from '../components/Navbar/Navbar'
import { UsersProvider } from '../context/UsersContext'
import { useScrollRestoration } from '../hooks/useScrollRestoration'
import styles from './AppLayout.module.css'

export function AppLayout() {
  // El <main> es el contenedor scrolleable (overflow-y: auto) y persiste entre
  // navegaciones, así que preservamos su scroll por ruta desde acá, una vez para toda la app.
  const contentRef = useRef<HTMLElement>(null)
  useScrollRestoration(contentRef)

  return (
    <UsersProvider>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.rightCol}>
          <Navbar />
          <main className={styles.content} ref={contentRef}>
            <Outlet />
          </main>
        </div>
      </div>
    </UsersProvider>
  )
}

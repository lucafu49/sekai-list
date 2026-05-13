import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar/Sidebar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}

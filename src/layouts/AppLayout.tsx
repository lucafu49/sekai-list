import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { Navbar } from '../components/Navbar/Navbar'
import { UsersProvider } from '../context/UsersContext'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <UsersProvider>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.rightCol}>
          <Navbar />
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </UsersProvider>
  )
}

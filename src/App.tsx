import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AnimeDetailPage } from './pages/AnimeDetailPage'
import { TitlesPage } from './pages/TitlesPage'
import { SearchPage } from './pages/SearchPage'
import { UserPage } from './pages/UserPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { useAuth } from './auth/AuthContext'
import { useToast } from './context/ToastContext'

// Escucha el evento 'session-expired' despachado por client.ts cuando el backend devuelve 401.
// Llama a logout() para limpiar el estado de usuario (el token ya fue eliminado por client.ts)
// y muestra un toast de advertencia. ProtectedRoute redirige a /login automáticamente.
function SessionWatcher() {
  const { logout } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    function handleExpired() {
      logout()
      showToast('Tu sesión venció. Por favor iniciá sesión nuevamente.', 'warning')
    }
    window.addEventListener('session-expired', handleExpired)
    return () => window.removeEventListener('session-expired', handleExpired)
  }, [logout, showToast])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <SessionWatcher />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/titles" element={<TitlesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/anime/:animeId" element={<AnimeDetailPage />} />
            <Route path="/user/:userId" element={<UserPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiException } from '../api/types'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ username, password })
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.apiError.message)
      } else {
        setError('Error inesperado. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>SekaiList</h1>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              className={styles.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

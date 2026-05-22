import { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'
import { CheckCircle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number
  message: string
  exiting?: boolean
}

interface ToastContextValue {
  showToast: (message: string) => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ── Provider ─────────────────────────────────────────────────────────────────

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message }])
    // Marca como exiting para disparar la animación de salida
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    }, 2750)
    // Elimina del DOM cuando termina la animación
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className={styles.container}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`${styles.toast} ${toast.exiting ? styles.toastExiting : ''}`}
            >
              <CheckCircle size={18} className={styles.icon} />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

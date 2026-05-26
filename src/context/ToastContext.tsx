import { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'
import { CheckCircle, AlertTriangle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
  exiting?: boolean
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
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

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
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
              className={`${styles.toast} ${styles[toast.type]} ${toast.exiting ? styles.toastExiting : ''}`}
            >
              {toast.type === 'warning'
                ? <AlertTriangle size={18} className={styles.icon} />
                : <CheckCircle size={18} className={styles.icon} />
              }
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

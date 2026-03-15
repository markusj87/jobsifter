import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { CheckCircleIcon } from './icons'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          zIndex: 9999, pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const bgColor = toast.type === 'success'
    ? 'var(--color-green-soft)'
    : toast.type === 'error'
      ? 'var(--color-red-soft)'
      : 'var(--color-accent-soft)'

  const textColor = toast.type === 'success'
    ? 'var(--color-green-text)'
    : toast.type === 'error'
      ? 'var(--color-red-text)'
      : 'var(--color-accent)'

  const borderColor = toast.type === 'success'
    ? 'rgba(52, 199, 89, 0.2)'
    : toast.type === 'error'
      ? 'rgba(255, 59, 48, 0.2)'
      : 'rgba(0, 113, 227, 0.2)'

  return (
    <div
      style={{
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'auto',
        transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
        maxWidth: '380px'
      }}
    >
      <CheckCircleIcon size={18} className="" style={{ color: textColor, flexShrink: 0 } as React.CSSProperties} />
      <span style={{
        fontSize: '13px', fontWeight: 500, color: textColor,
        lineHeight: 1.4
      }}>
        {toast.message}
      </span>
    </div>
  )
}

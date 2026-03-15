import { ReactNode, useId } from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  closeOnBackdrop?: boolean
}

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  closeOnBackdrop = true
}: DialogProps) {
  const titleId = useId()

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        style={{
          background: 'var(--color-surface-solid)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '28px 28px 24px',
          maxWidth: '480px',
          width: '90%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 4px 0'
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 20px 0',
              lineHeight: 1.5
            }}
          >
            {description}
          </p>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

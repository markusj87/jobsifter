import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40px'
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '36px 32px 28px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-red-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px'
              }}
            >
              !
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                margin: '0 0 8px 0'
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 6px 0',
                lineHeight: 1.5
              }}
            >
              An unexpected error occurred. Please reload to continue.
            </p>
            {this.state.error && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-quaternary)',
                  margin: '0 0 20px 0',
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-word'
                }}
              >
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="pill-button pill-button-primary"
              style={{ fontSize: '15px', padding: '10px 28px' }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

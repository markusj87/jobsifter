import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-screen"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Titlebar drag region for frameless Electron window */}
      <div
        className="fixed top-0 left-0 right-0 h-8 z-50"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="page-enter px-8 py-8 pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}

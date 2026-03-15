import { NavLink } from 'react-router-dom'
import {
  DashboardIcon,
  ScanIcon,
  BriefcaseIcon,
  DocumentIcon,
  FileTextIcon,
  SparkleIcon,
  SettingsIcon
} from '../icons'
import { ComponentType } from 'react'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/scan', label: 'Scan Jobs', icon: ScanIcon },
  { to: '/jobs', label: 'My Jobs', icon: BriefcaseIcon },
  { to: '/resume', label: 'Resume', icon: FileTextIcon },
  { to: '/cv-feedback', label: 'Resume Feedback', icon: SparkleIcon },
  { to: '/cover-letters', label: 'Cover Letters', icon: DocumentIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
]

export default function Sidebar() {
  return (
    <aside
      className="
        w-56 flex flex-col
        border-r border-[var(--color-border-light)]
      "
      style={{
        background: 'var(--color-sidebar-bg)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)'
      }}
    >
      {/* App title area */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="
              w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center
            "
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 1px 4px rgba(0, 113, 227, 0.3)'
            }}
          >
            <BriefcaseIcon size={16} className="text-white" />
          </div>
          <div>
            <h1
              className="text-[13px] font-semibold leading-tight"
              style={{
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              JobSifter
            </h1>
            <p
              className="text-[10px] leading-tight mt-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              AI Job Matching
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-1">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    [
                      'sidebar-nav-item group flex items-center gap-2.5 px-3 py-[7px] rounded-[var(--radius-sm)] text-[13px] font-medium',
                      'transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                      isActive
                        ? 'sidebar-nav-active'
                        : 'sidebar-nav-inactive'
                    ].join(' ')
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: 'var(--color-accent-soft)',
                          color: 'var(--color-accent)'
                        }
                      : {
                          color: 'var(--color-text-secondary)'
                        }
                  }
                >
                  <Icon size={18} className="flex-shrink-0 opacity-80" />
                  <span style={{ letterSpacing: '-0.01em' }}>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Version footer */}
      <div
        className="px-5 py-3"
        style={{
          borderTop: '1px solid var(--color-border-light)'
        }}
      >
        <span
          className="text-[10px] font-medium"
          style={{
            color: 'var(--color-text-quaternary)',
            letterSpacing: '0.02em'
          }}
        >
          v1.0.0
        </span>
      </div>
    </aside>
  )
}

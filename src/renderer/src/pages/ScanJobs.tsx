import { useState, useEffect, useRef } from 'react'
import type { ScanProgress } from '../../../shared/types'
import { LINKEDIN_CATEGORIES } from '../../../shared/constants'
import { ExternalLinkIcon, ScanIcon, StopIcon, CheckCircleIcon, PlusIcon, DownloadIcon } from '../components/icons'
import Dialog from '../components/Dialog'

// Global scan state lives outside the component so it persists across tab
// navigation. React unmounts the component when the user switches tabs, but
// scanning continues in the main process. Keeping state at module scope lets
// the component re-hydrate from the latest progress when the user returns.
let gScanning = false
let gProgress: ScanProgress | null = null
let gRecentJobs: string[] = []
let gScanLogs: string[] = []
let gLinkedInConnected = false
let gBrowserStatus: { status: string; message: string } | null = null
const scanListeners = new Set<() => void>()

function notifyScanListeners() {
  scanListeners.forEach((fn) => fn())
}

let scanListenerSetup = false
function setupGlobalScanListeners() {
  if (scanListenerSetup) return
  scanListenerSetup = true

  window.api.scan.onProgress((data) => {
    const p = data as ScanProgress
    gProgress = p
    if (p.currentJob) {
      gRecentJobs = [p.currentJob, ...gRecentJobs.slice(0, 29)]
    }
    if (p.status === 'completed' || p.status === 'error') {
      gScanning = false
    }
    notifyScanListeners()
  })

  window.api.scan.onLog((msg: string) => {
    gScanLogs = [msg, ...gScanLogs.slice(0, 99)]
    notifyScanListeners()
  })

  window.api.scan.onBrowserStatus((data) => {
    gBrowserStatus = data.status === 'installed' ? null : data
    notifyScanListeners()
  })
}

export default function ScanJobs() {
  const [linkedInConnected, setLinkedInConnected] = useState(gLinkedInConnected)
  const [scanning, setScanning] = useState(gScanning)
  const [progress, setProgress] = useState<ScanProgress | null>(gProgress)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    LINKEDIN_CATEGORIES.map((c) => c.id)
  )
  const [recentJobs, setRecentJobs] = useState<string[]>(gRecentJobs)
  const [scanLogs, setScanLogs] = useState<string[]>(gScanLogs)
  const [customSearches, setCustomSearches] = useState<{ keywords: string; location: string }[]>([])
  const [searchKeywords, setSearchKeywords] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [browserStatus, setBrowserStatus] = useState<{ status: string; message: string } | null>(gBrowserStatus)
  const linkedInCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setupGlobalScanListeners()
    const listener = () => {
      setScanning(gScanning)
      setProgress(gProgress)
      setRecentJobs([...gRecentJobs])
      setScanLogs([...gScanLogs])
      setBrowserStatus(gBrowserStatus)
    }
    scanListeners.add(listener)
    return () => {
      scanListeners.delete(listener)
      if (linkedInCheckIntervalRef.current) {
        clearInterval(linkedInCheckIntervalRef.current)
        linkedInCheckIntervalRef.current = null
      }
    }
  }, [])

  const handleConnectLinkedIn = async () => {
    await window.api.linkedin.open()
    const interval = setInterval(async () => {
      const connected = await window.api.linkedin.checkSession()
      if (connected) {
        gLinkedInConnected = true
        setLinkedInConnected(true)
        clearInterval(interval)
        linkedInCheckIntervalRef.current = null
      }
    }, 3000)
    linkedInCheckIntervalRef.current = interval
    setTimeout(() => {
      clearInterval(interval)
      if (linkedInCheckIntervalRef.current === interval) {
        linkedInCheckIntervalRef.current = null
      }
    }, 300000)
  }

  const handleStartScan = async () => {
    gScanning = true
    gRecentJobs = []
    gScanLogs = []
    gProgress = null
    setScanning(true)
    setRecentJobs([])
    setScanLogs([])
    setProgress(null)
    await window.api.scan.start(selectedCategories, customSearches.length > 0 ? customSearches : undefined)
  }

  const handleStopScan = async () => {
    await window.api.scan.stop()
    setScanning(false)
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const progressPercent =
    progress && progress.status === 'scanning'
      ? Math.min(((progress.jobsFound || 0) % 100), 100)
      : progress?.status === 'completed'
        ? 100
        : 0

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          Scan Jobs
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--color-text-tertiary)',
            marginTop: '6px',
            fontWeight: 400,
          }}
        >
          Connect to LinkedIn and discover new opportunities
        </p>
      </div>

      <div className="stagger-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Browser Install Dialog */}
        <Dialog
          open={browserStatus?.status === 'installing'}
          onClose={() => {}}
          title="Setting up browser"
          closeOnBackdrop={false}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DownloadIcon size={24} className="text-[var(--color-accent)]" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: 500, margin: '0 0 6px 0' }}>
                Downloading Chromium browser
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                This is a one-time setup (~170MB) that happens automatically. No action needed from you - just wait about a minute.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', margin: 0, lineHeight: 1.5 }}>
                Chromium is the open source browser engine that powers Google Chrome. JobSifter uses its own private copy to browse job listings on your behalf. It is installed in your user folder and does not affect your system or other browsers.
              </p>
            </div>
            <div style={{
              width: '100%', height: '4px', borderRadius: '2px',
              background: 'var(--color-surface-active)', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', borderRadius: '2px', background: 'var(--color-accent)',
                animation: 'indeterminate 1.5s ease-in-out infinite',
                width: '40%'
              }} />
            </div>
          </div>
        </Dialog>

        {/* LinkedIn Connection Card */}
        <div
          className="glass-card"
          style={{ padding: '24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: linkedInConnected
                    ? 'var(--color-green-soft)'
                    : 'var(--color-accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {linkedInConnected ? (
                  <CheckCircleIcon size={22} className="" />
                ) : (
                  <ExternalLinkIcon size={22} className="" />
                )}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  LinkedIn Connection
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: linkedInConnected
                      ? 'var(--color-green-text)'
                      : 'var(--color-text-tertiary)',
                    margin: '2px 0 0 0',
                    fontWeight: 400,
                  }}
                >
                  {linkedInConnected
                    ? 'Connected and ready to scan'
                    : 'Sign in to LinkedIn to start scanning'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: linkedInConnected ? 'var(--color-green)' : 'var(--color-text-quaternary)',
                  boxShadow: linkedInConnected
                    ? '0 0 0 3px var(--color-green-soft)'
                    : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              {!linkedInConnected && (
                <button
                  onClick={handleConnectLinkedIn}
                  className="pill-button pill-button-primary"
                  style={{
                    gap: '6px',
                    background: 'var(--color-accent)',
                    fontSize: '13px',
                    padding: '8px 20px',
                  }}
                >
                  <ExternalLinkIcon size={14} />
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Search */}
        <div className="glass-card-solid" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 14px 0', letterSpacing: '-0.01em' }}>
            Custom Search
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: customSearches.length > 0 ? '14px' : 0 }}>
            <input
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              placeholder="Keywords (e.g. CEO, Developer...)"
              className="apple-input"
              style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchKeywords.trim()) {
                  setCustomSearches((prev) => [...prev, { keywords: searchKeywords.trim(), location: searchLocation.trim() }])
                  setSearchKeywords('')
                  setSearchLocation('')
                }
              }}
            />
            <input
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Location (optional)"
              className="apple-input"
              style={{ width: '180px', fontSize: '13px', padding: '8px 12px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchKeywords.trim()) {
                  setCustomSearches((prev) => [...prev, { keywords: searchKeywords.trim(), location: searchLocation.trim() }])
                  setSearchKeywords('')
                  setSearchLocation('')
                }
              }}
            />
            <button
              onClick={() => {
                if (!searchKeywords.trim()) return
                setCustomSearches((prev) => [...prev, { keywords: searchKeywords.trim(), location: searchLocation.trim() }])
                setSearchKeywords('')
                setSearchLocation('')
              }}
              disabled={!searchKeywords.trim()}
              className="pill-button pill-button-primary"
              style={{ fontSize: '13px', padding: '8px 16px', gap: '4px', opacity: searchKeywords.trim() ? 1 : 0.4 }}
            >
              <PlusIcon size={14} />
              Add
            </button>
          </div>

          {customSearches.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {customSearches.map((s, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 8px 5px 12px', borderRadius: '980px', fontSize: '12px', fontWeight: 500,
                    background: 'var(--color-purple-soft)', color: 'var(--color-purple)'
                  }}
                >
                  {s.keywords}{s.location ? ` \u00B7 ${s.location}` : ''}
                  <button
                    onClick={() => setCustomSearches((prev) => prev.filter((_, j) => j !== i))}
                    style={{
                      width: '16px', height: '16px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: 'rgba(175, 82, 222, 0.2)', color: 'var(--color-purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', lineHeight: 1, padding: 0
                    }}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div
          className="glass-card-solid"
          style={{ padding: '24px' }}
        >
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 14px 0',
              letterSpacing: '-0.01em',
            }}
          >
            Categories to Scan
          </h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setSelectedCategories(LINKEDIN_CATEGORIES.map((c) => c.id))}
              className="pill-button pill-button-secondary"
              style={{ fontSize: '12px', padding: '5px 14px' }}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedCategories([])}
              className="pill-button pill-button-secondary"
              style={{ fontSize: '12px', padding: '5px 14px' }}
            >
              Deselect All
            </button>
            <span style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', display: 'flex', alignItems: 'center' }}>
              {selectedCategories.length} / {LINKEDIN_CATEGORIES.length} selected
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {LINKEDIN_CATEGORIES.map((cat) => {
              const isActive = selectedCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className="pill-button"
                  style={{
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    background: isActive
                      ? 'var(--color-accent)'
                      : 'var(--color-surface-hover)',
                    color: isActive
                      ? '#fff'
                      : 'var(--color-text-secondary)',
                    border: isActive
                      ? '1px solid transparent'
                      : '1px solid var(--color-border)',
                    transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scan Controls */}
        <div
          className="glass-card-solid"
          style={{ padding: '24px' }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            {!scanning ? (
              <>
                <button
                  onClick={handleStartScan}
                  disabled={selectedCategories.length === 0 && customSearches.length === 0}
                  className="pill-button pill-button-primary"
                  style={{
                    padding: '12px 40px',
                    fontSize: '16px',
                    fontWeight: 600,
                    gap: '8px',
                    letterSpacing: '-0.01em',
                    opacity: selectedCategories.length === 0 && customSearches.length === 0 ? 0.4 : 1,
                    cursor: selectedCategories.length === 0 && customSearches.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ScanIcon size={20} className="" />
                  Start Scan
                </button>
              </>
            ) : (
              <button
                onClick={handleStopScan}
                className="pill-button"
                style={{
                  padding: '12px 40px',
                  fontSize: '16px',
                  fontWeight: 600,
                  gap: '8px',
                  letterSpacing: '-0.01em',
                  background: 'var(--color-red-soft)',
                  color: 'var(--color-red-text)',
                  border: '1px solid rgba(255, 59, 48, 0.2)',
                }}
              >
                <StopIcon size={20} className="" />
                Stop Scan
              </button>
            )}

            <p style={{
              fontSize: '12px', color: 'var(--color-text-quaternary)',
              textAlign: 'center', maxWidth: '420px', lineHeight: 1.6, margin: 0
            }}>
              Grab a coffee, go for a walk, or let it run overnight. Scanning takes time since each job is opened individually. As a rough guide, 100 jobs takes around 15 minutes. Scanning does not use AI or consume any API tokens - it only uses your local browser.
            </p>

            {/* Progress Section */}
            {progress && (
              <div style={{ width: '100%', maxWidth: '480px' }}>
                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'var(--color-surface-active)',
                    overflow: 'hidden',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: progress.status === 'error'
                        ? 'var(--color-red)'
                        : 'var(--color-accent)',
                      width: `${progressPercent}%`,
                      transition: 'width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                  />
                </div>

                {/* Stats Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        letterSpacing: '-0.03em',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {progress.jobsFound}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-tertiary)',
                        marginLeft: '6px',
                        fontWeight: 400,
                      }}
                    >
                      jobs found
                    </span>
                  </div>
                  {progress.category && (
                    <>
                      <span
                        style={{
                          width: '1px',
                          height: '20px',
                          background: 'var(--color-border)',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--color-text-tertiary)',
                          fontWeight: 400,
                        }}
                      >
                        Scanning: {progress.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {progress?.status === 'error' && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px 18px',
                background: 'var(--color-red-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 59, 48, 0.12)',
                color: 'var(--color-red-text)',
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {progress.errorMessage}
            </div>
          )}
        </div>

        {/* Live Feed */}
        {recentJobs.length > 0 && (
          <div
            className="glass-card-solid"
            style={{ padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Recently Found
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text-quaternary)',
                  background: 'var(--color-surface-hover)',
                  padding: '3px 10px',
                  borderRadius: '980px',
                }}
              >
                {recentJobs.length} items
              </span>
            </div>
            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {recentJobs.map((job, i) => (
                <div
                  key={i}
                  className={i === 0 && scanning ? 'page-enter' : ''}
                  style={{
                    padding: '10px 0',
                    borderBottom:
                      i < recentJobs.length - 1
                        ? '1px solid var(--color-border-light)'
                        : 'none',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color:
                      i === 0
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                    fontWeight: i === 0 ? 500 : 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.5,
                  }}
                >
                  {job}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner Log */}
        {scanLogs.length > 0 && (
          <div
            className="glass-card-solid"
            style={{ padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Scanner Log
              </h3>
              <button
                onClick={() => setScanLogs([])}
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-quaternary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                maxHeight: '240px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {scanLogs.map((logMsg, i) => (
                <div
                  key={i}
                  style={{
                    padding: '4px 0',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: logMsg.includes('ERROR')
                      ? 'var(--color-red-text)'
                      : logMsg.includes('Saved')
                        ? 'var(--color-green-text)'
                        : logMsg.includes('===')
                          ? 'var(--color-accent)'
                          : 'var(--color-text-tertiary)',
                    fontWeight: logMsg.includes('ERROR') || logMsg.includes('===') ? 500 : 400,
                    lineHeight: 1.4,
                  }}
                >
                  {logMsg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

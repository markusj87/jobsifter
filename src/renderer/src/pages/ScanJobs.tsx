import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ScanProgress } from '../../../shared/types'
import { LINKEDIN_CATEGORIES } from '../../../shared/constants'
import { ExternalLinkIcon, ScanIcon, StopIcon, CheckCircleIcon, PlusIcon, LinkedInIcon, GlobeIcon, ZapIcon } from '../components/icons'

// ─── Global scan state (persists across tab navigation) ─────────────────────

interface RecentJob {
  title: string
  id?: number
}

let gScanning = false
let gProgress: ScanProgress | null = null
let gRecentJobs: RecentJob[] = []
let gScanLogs: string[] = []
let gLinkedInConnected = false
let gActiveSource: string | null = null
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
      gRecentJobs = [{ title: p.currentJob, id: p.jobId }, ...gRecentJobs.slice(0, 29)]
    }
    if (p.status === 'completed' || p.status === 'error') {
      gScanning = false
      gActiveSource = null
    }
    notifyScanListeners()
  })

  window.api.scan.onLog((msg: string) => {
    gScanLogs = [msg, ...gScanLogs.slice(0, 99)]
    notifyScanListeners()
  })
}

type SourceTab = 'linkedin' | 'indeed' | 'platsbanken' | 'remoteok'

const SOURCE_TABS: { id: SourceTab; name: string; color: string }[] = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
  { id: 'indeed', name: 'Indeed', color: '#2557A7' },
  { id: 'platsbanken', name: 'Platsbanken (Sweden)', color: '#006341' },
  { id: 'remoteok', name: 'RemoteOK', color: '#FF4742' }
]

export default function ScanJobs() {
  const [activeTab, setActiveTab] = useState<SourceTab>(
    (gActiveSource as SourceTab) || 'linkedin'
  )
  const [linkedInConnected, setLinkedInConnected] = useState(gLinkedInConnected)
  const [scanning, setScanning] = useState(gScanning)
  const [progress, setProgress] = useState<ScanProgress | null>(gProgress)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    LINKEDIN_CATEGORIES.map((c) => c.id)
  )
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>(gRecentJobs)
  const navigate = useNavigate()
  const [scanLogs, setScanLogs] = useState<string[]>(gScanLogs)
  const [customSearches, setCustomSearches] = useState<{ keywords: string; location: string }[]>([])
  const [searchKeywords, setSearchKeywords] = useState('')
  const [searchLocation, setSearchLocation] = useState('')

  // Source-specific fields
  const [indeedKeywords, setIndeedKeywords] = useState('')
  const [indeedLocation, setIndeedLocation] = useState('')
  const [platsbankenKeywords, setPlatsbankenKeywords] = useState('')
  const [platsbankenLocation, setPlatsbankenLocation] = useState('')
  const [remoteokKeywords, setRemoteokKeywords] = useState('')

  const linkedInCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setupGlobalScanListeners()
    const listener = () => {
      setScanning(gScanning)
      setProgress(gProgress)
      setRecentJobs([...gRecentJobs])
      setScanLogs([...gScanLogs])
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

  // ─── LinkedIn handlers ──────────────────────────────────────────────

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

  const handleStartLinkedInScan = async () => {
    gScanning = true
    gActiveSource = 'linkedin'
    gRecentJobs = []
    gScanLogs = []
    gProgress = null
    setScanning(true)
    setRecentJobs([])
    setScanLogs([])
    setProgress(null)
    await window.api.scan.start('linkedin', {
      keywords: '',
      categories: selectedCategories,
      customSearches: customSearches.length > 0 ? customSearches : undefined
    })
  }

  // ─── Generic source handlers ────────────────────────────────────────

  const handleStartSourceScan = async (sourceId: string, keywords: string, location?: string) => {
    gScanning = true
    gActiveSource = sourceId
    gRecentJobs = []
    gScanLogs = []
    gProgress = null
    setScanning(true)
    setRecentJobs([])
    setScanLogs([])
    setProgress(null)
    await window.api.scan.start(sourceId, {
      keywords,
      location: location || undefined
    })
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

  const canStartLinkedIn = selectedCategories.length > 0 || customSearches.length > 0

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Scan Jobs
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px', fontWeight: 400 }}>
          Discover opportunities across multiple platforms
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '4px', border: '1px solid var(--color-border-light)' }}>
        {SOURCE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const isScanning = scanning && gActiveSource === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: isScanning && !isActive ? `1px solid ${tab.color}40` : 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : isScanning ? tab.color : 'var(--color-text-secondary)',
                background: isActive ? tab.color : isScanning ? `${tab.color}10` : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                position: 'relative' as const
              }}
            >
              {tab.id === 'linkedin' && <LinkedInIcon size={14} />}
              {tab.id === 'indeed' && <ScanIcon size={14} />}
              {tab.id === 'platsbanken' && <ZapIcon size={14} />}
              {tab.id === 'remoteok' && <GlobeIcon size={14} />}
              {tab.name}
              {isScanning && !isActive && (
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: tab.color, flexShrink: 0,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div className="stagger-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ═══ LinkedIn Tab ═══ */}
        {activeTab === 'linkedin' && (
          <>
            {/* LinkedIn Connection Card */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                    background: linkedInConnected ? 'var(--color-green-soft)' : 'var(--color-accent-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {linkedInConnected ? <CheckCircleIcon size={22} className="" /> : <ExternalLinkIcon size={22} className="" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                      LinkedIn Connection
                    </h3>
                    <p style={{ fontSize: '13px', color: linkedInConnected ? 'var(--color-green-text)' : 'var(--color-text-tertiary)', margin: '2px 0 0 0', fontWeight: 400 }}>
                      {linkedInConnected ? 'Connected and ready to scan' : 'Sign in to LinkedIn to start scanning'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: linkedInConnected ? 'var(--color-green)' : 'var(--color-text-quaternary)',
                    boxShadow: linkedInConnected ? '0 0 0 3px var(--color-green-soft)' : 'none',
                    transition: 'all 0.3s ease'
                  }} />
                  {!linkedInConnected && (
                    <button onClick={handleConnectLinkedIn} className="pill-button pill-button-primary"
                      style={{ gap: '6px', background: 'var(--color-accent)', fontSize: '13px', padding: '8px 20px' }}>
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
                <input value={searchKeywords} onChange={(e) => setSearchKeywords(e.target.value)}
                  placeholder="Keywords (e.g. CEO, Developer...)" className="apple-input"
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchKeywords.trim()) {
                      setCustomSearches((prev) => [...prev, { keywords: searchKeywords.trim(), location: searchLocation.trim() }])
                      setSearchKeywords(''); setSearchLocation('')
                    }
                  }}
                />
                <input value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Location (optional)" className="apple-input"
                  style={{ width: '180px', fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchKeywords.trim()) {
                      setCustomSearches((prev) => [...prev, { keywords: searchKeywords.trim(), location: searchLocation.trim() }])
                      setSearchKeywords(''); setSearchLocation('')
                    }
                  }}
                />
                <button onClick={() => {
                  if (!searchKeywords.trim()) return
                  setCustomSearches((prev) => [...prev, { keywords: searchKeywords.trim(), location: searchLocation.trim() }])
                  setSearchKeywords(''); setSearchLocation('')
                }} disabled={!searchKeywords.trim()} className="pill-button pill-button-primary"
                  style={{ fontSize: '13px', padding: '8px 16px', gap: '4px', opacity: searchKeywords.trim() ? 1 : 0.4 }}>
                  <PlusIcon size={14} />
                  Add
                </button>
              </div>
              {customSearches.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {customSearches.map((s, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 8px 5px 12px', borderRadius: '980px', fontSize: '12px', fontWeight: 500,
                      background: 'var(--color-purple-soft)', color: 'var(--color-purple)'
                    }}>
                      {s.keywords}{s.location ? ` \u00B7 ${s.location}` : ''}
                      <button onClick={() => setCustomSearches((prev) => prev.filter((_, j) => j !== i))}
                        style={{
                          width: '16px', height: '16px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                          background: 'rgba(175, 82, 222, 0.2)', color: 'var(--color-purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', lineHeight: 1, padding: 0
                        }}>x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Category Selection */}
            <div className="glass-card-solid" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 14px 0', letterSpacing: '-0.01em' }}>
                Categories to Scan
              </h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setSelectedCategories(LINKEDIN_CATEGORIES.map((c) => c.id))}
                  className="pill-button pill-button-secondary" style={{ fontSize: '12px', padding: '5px 14px' }}>
                  Select All
                </button>
                <button onClick={() => setSelectedCategories([])}
                  className="pill-button pill-button-secondary" style={{ fontSize: '12px', padding: '5px 14px' }}>
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
                    <button key={cat.id} onClick={() => toggleCategory(cat.id)} className="pill-button"
                      style={{
                        padding: '7px 16px', fontSize: '13px', fontWeight: 500,
                        background: isActive ? 'var(--color-accent)' : 'var(--color-surface-hover)',
                        color: isActive ? '#fff' : 'var(--color-text-secondary)',
                        border: isActive ? '1px solid transparent' : '1px solid var(--color-border)',
                        transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)'
                      }}>
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* LinkedIn Scan Button */}
            <ScanControlCard
              scanning={scanning && gActiveSource === 'linkedin'}
              onStart={handleStartLinkedInScan}
              onStop={handleStopScan}
              disabled={!canStartLinkedIn}
              helpText="Grab a coffee, go for a walk, or let it run overnight. Scanning takes time since each job is opened individually. As a rough guide, 100 jobs takes around 15 minutes. Scanning does not use AI or consume any API tokens - it only uses your local browser."
            />
          </>
        )}

        {/* ═══ Indeed Tab ═══ */}
        {activeTab === 'indeed' && (
          <>
            <SourceInfoCard text="Indeed jobs are publicly available. No login required. Uses browser automation to extract job details." />
            <div className="glass-card-solid" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 14px 0' }}>Search</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={indeedKeywords} onChange={(e) => setIndeedKeywords(e.target.value)}
                  placeholder="Keywords (e.g. developer, designer...)" className="apple-input"
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && indeedKeywords.trim()) handleStartSourceScan('indeed', indeedKeywords.trim(), indeedLocation.trim()) }}
                />
                <input value={indeedLocation} onChange={(e) => setIndeedLocation(e.target.value)}
                  placeholder="Location (optional)" className="apple-input"
                  style={{ width: '200px', fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && indeedKeywords.trim()) handleStartSourceScan('indeed', indeedKeywords.trim(), indeedLocation.trim()) }}
                />
              </div>
            </div>
            <ScanControlCard
              scanning={scanning && gActiveSource === 'indeed'}
              onStart={() => handleStartSourceScan('indeed', indeedKeywords.trim(), indeedLocation.trim())}
              onStop={handleStopScan}
              disabled={!indeedKeywords.trim()}
              helpText="Indeed search results are scraped using browser automation. No API tokens used."
            />
          </>
        )}

        {/* ═══ Platsbanken Tab ═══ */}
        {activeTab === 'platsbanken' && (
          <>
            <SourceInfoCard text="Platsbanken is Sweden's official job board by Arbetsf&#246;rmedlingen. Uses open API - extremely fast, no browser needed. Hundreds of jobs in seconds." />
            <div className="glass-card-solid" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 14px 0' }}>Search</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={platsbankenKeywords} onChange={(e) => setPlatsbankenKeywords(e.target.value)}
                  placeholder="Keywords (e.g. utvecklare, data...)" className="apple-input"
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && platsbankenKeywords.trim()) handleStartSourceScan('platsbanken', platsbankenKeywords.trim(), platsbankenLocation.trim()) }}
                />
                <input value={platsbankenLocation} onChange={(e) => setPlatsbankenLocation(e.target.value)}
                  placeholder="City (e.g. Stockholm, Malm&#246;...)" className="apple-input"
                  style={{ width: '200px', fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && platsbankenKeywords.trim()) handleStartSourceScan('platsbanken', platsbankenKeywords.trim(), platsbankenLocation.trim()) }}
                />
              </div>
            </div>
            <ScanControlCard
              scanning={scanning && gActiveSource === 'platsbanken'}
              onStart={() => handleStartSourceScan('platsbanken', platsbankenKeywords.trim(), platsbankenLocation.trim())}
              onStop={handleStopScan}
              disabled={!platsbankenKeywords.trim()}
              helpText="Uses Arbetsf&#246;rmedlingen's open API. No browser or API tokens needed. Extremely fast."
            />
          </>
        )}

        {/* ═══ RemoteOK Tab ═══ */}
        {activeTab === 'remoteok' && (
          <>
            <SourceInfoCard text="RemoteOK lists remote-only positions worldwide. Uses public API - fast, no browser needed." />
            <div className="glass-card-solid" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 14px 0' }}>Search</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={remoteokKeywords} onChange={(e) => setRemoteokKeywords(e.target.value)}
                  placeholder="Tags (e.g. developer, design, python...)" className="apple-input"
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleStartSourceScan('remoteok', remoteokKeywords.trim()) }}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', marginTop: '8px', marginBottom: 0 }}>
                Leave empty to fetch all available remote jobs.
              </p>
            </div>
            <ScanControlCard
              scanning={scanning && gActiveSource === 'remoteok'}
              onStart={() => handleStartSourceScan('remoteok', remoteokKeywords.trim())}
              onStop={handleStopScan}
              disabled={false}
              helpText="Fetches all matching remote jobs in a single API call. No browser or API tokens needed."
            />
          </>
        )}

        {/* ─── Shared: Progress, Recent Jobs, Scanner Log ─────────────── */}

        {/* Progress Section */}
        {progress && (
          <div className="glass-card-solid" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '100%', maxWidth: '480px' }}>
                <div style={{
                  width: '100%', height: '4px', borderRadius: '2px',
                  background: 'var(--color-surface-active)', overflow: 'hidden', marginBottom: '14px'
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    background: progress.status === 'error' ? 'var(--color-red)' : 'var(--color-accent)',
                    width: `${progressPercent}%`,
                    transition: 'width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
                  }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {progress.jobsFound}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginLeft: '6px', fontWeight: 400 }}>
                      jobs found
                    </span>
                  </div>
                  {progress.category && (
                    <>
                      <span style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                        Scanning: {progress.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {progress.status === 'error' && (
              <div style={{
                marginTop: '16px', padding: '14px 18px',
                background: 'var(--color-red-soft)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 59, 48, 0.12)',
                color: 'var(--color-red-text)', fontSize: '13px', fontWeight: 500, lineHeight: 1.5
              }}>
                {progress.errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Live Feed */}
        {recentJobs.length > 0 && (
          <div className="glass-card-solid" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Recently Found
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-quaternary)', background: 'var(--color-surface-hover)', padding: '3px 10px', borderRadius: '980px' }}>
                {recentJobs.length} items
              </span>
            </div>
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {recentJobs.map((job, i) => (
                <div key={i} className={i === 0 && scanning ? 'page-enter' : ''}
                  style={{
                    padding: '10px 0',
                    borderBottom: i < recentJobs.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                    fontSize: '13px', fontFamily: 'var(--font-mono)',
                    color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: i === 0 ? 500 : 400, letterSpacing: '-0.01em', lineHeight: 1.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
                  }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{job.title}</span>
                  {job.id ? (
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      style={{
                        flexShrink: 0, padding: '3px 10px', borderRadius: '980px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 500, fontFamily: 'var(--font-sans)',
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-soft)'; e.currentTarget.style.color = 'var(--color-accent)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                    >
                      <ExternalLinkIcon size={10} />
                      Open
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner Log */}
        {scanLogs.length > 0 && (
          <div className="glass-card-solid" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Scanner Log
              </h3>
              <button onClick={() => setScanLogs([])}
                style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {scanLogs.map((logMsg, i) => (
                <div key={i} style={{
                  padding: '4px 0', fontSize: '11px', fontFamily: 'var(--font-mono)',
                  color: logMsg.includes('ERROR') ? 'var(--color-red-text)'
                    : logMsg.includes('Saved') || logMsg.includes('complete') ? 'var(--color-green-text)'
                      : logMsg.includes('===') ? 'var(--color-accent)'
                        : 'var(--color-text-tertiary)',
                  fontWeight: logMsg.includes('ERROR') || logMsg.includes('===') ? 500 : 400, lineHeight: 1.4
                }}>
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

// ─── Sub-components ───────────────────────────────────────────────────

function SourceInfoCard({ text }: { text: string }) {
  return (
    <div className="glass-card" style={{
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px',
      background: 'var(--color-accent-soft)', border: '1px solid rgba(0, 122, 255, 0.12)'
    }}>
      <ZapIcon size={16} />
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  )
}

function ScanControlCard({ scanning, onStart, onStop, disabled, helpText }: {
  scanning: boolean
  onStart: () => void
  onStop: () => void
  disabled: boolean
  helpText: string
}) {
  return (
    <div className="glass-card-solid" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        {!scanning ? (
          <button onClick={onStart} disabled={disabled}
            className="pill-button pill-button-primary"
            style={{
              padding: '12px 40px', fontSize: '16px', fontWeight: 600, gap: '8px',
              letterSpacing: '-0.01em', opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}>
            <ScanIcon size={20} className="" />
            Start Scan
          </button>
        ) : (
          <button onClick={onStop} className="pill-button"
            style={{
              padding: '12px 40px', fontSize: '16px', fontWeight: 600, gap: '8px',
              letterSpacing: '-0.01em',
              background: 'var(--color-red-soft)', color: 'var(--color-red-text)',
              border: '1px solid rgba(255, 59, 48, 0.2)'
            }}>
            <StopIcon size={20} className="" />
            Stop Scan
          </button>
        )}
        <p style={{
          fontSize: '12px', color: 'var(--color-text-quaternary)',
          textAlign: 'center', maxWidth: '420px', lineHeight: 1.6, margin: 0
        }}>
          {helpText}
        </p>
      </div>
    </div>
  )
}

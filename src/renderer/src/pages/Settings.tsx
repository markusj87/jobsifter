import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import type { AIProvider } from '../../../shared/types'
import { SettingsIcon, TrashIcon, DownloadIcon, UploadIcon } from '../components/icons'
import Dialog from '../components/Dialog'

export default function Settings() {
  const [apiProvider, setApiProvider] = useState<AIProvider>('claude')
  const [apiKey, setApiKey] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [models, setModels] = useState<{ id: string; name: string; inputPricePerMTok: number; outputPricePerMTok: number }[]>([])
  const [scanDelay, setScanDelay] = useState('3')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    window.api.settings.get().then((settings) => {
      if (settings && typeof settings === 'object') {
        const s = settings as Record<string, string>
        if (s.aiProvider) setApiProvider(s.aiProvider as AIProvider)
        if (s.apiKey) setApiKey(s.apiKey)
        if (s.aiModel) setAiModel(s.aiModel)
        if (s.scanDelay) setScanDelay(s.scanDelay)
      }
    })
  }, [])

  useEffect(() => {
    window.api.ai.getModels(apiProvider).then((m) => {
      setModels(m)
      if (!aiModel || !m.some((mod) => mod.id === aiModel)) {
        setAiModel(m[0]?.id || '')
      }
    })
  }, [apiProvider])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await window.api.settings.set('aiProvider', apiProvider)
      await window.api.settings.set('apiKey', apiKey)
      await window.api.settings.set('aiModel', aiModel)
      await window.api.settings.set('scanDelay', scanDelay)
      setSaved(true)
      showToast('Settings saved successfully.', 'success')
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const handleDeleteAllJobs = async () => {
    try {
      await window.api.jobs.deleteAll()
      showToast('All jobs deleted.', 'success')
    } catch (err) {
      showToast(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
    setShowDeleteConfirm(false)
  }

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Settings
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
          Configure AI provider and scan preferences
        </p>
      </div>

      <div className="stagger-enter" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Left column: AI Provider */}
        <div className="glass-card-solid" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--color-purple-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon size={16} className="text-[var(--color-purple)]" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>AI Provider</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Provider</label>
              <select
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value as AIProvider)}
                className="apple-select"
                style={{ width: '100%' }}
              >
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="apple-input"
              />
              <p style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', marginTop: '6px', lineHeight: 1.6 }}>
                Your key is stored locally and never sent anywhere except {apiProvider === 'claude' ? 'Anthropic' : 'OpenAI'}.
                <br />
                <a
                  href={apiProvider === 'claude'
                    ? 'https://www.google.com/search?q=how+to+get+a+claude+api+key'
                    : 'https://www.google.com/search?q=how+to+get+a+openai+api+key'}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                >
                  How to get {apiProvider === 'claude' ? 'a Claude' : 'an OpenAI'} API key?
                </a>
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="apple-select"
                style={{ width: '100%' }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — ${m.inputPricePerMTok}/{m.outputPricePerMTok} per MTok</option>
                ))}
              </select>
            </div>

            {/* Pricing comparison */}
            {models.length > 0 && (
              <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px 0' }}>
                  Estimated cost for 100 jobs AI scoring
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {models.map((m) => {
                    // ~8K input + ~3K output per batch of 10 = ~800 input + ~300 output per job
                    const costPer100 = (100 * 800 * m.inputPricePerMTok / 1_000_000) + (100 * 300 * m.outputPricePerMTok / 1_000_000)
                    return (
                      <div key={m.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '4px 0',
                        fontWeight: m.id === aiModel ? 600 : 400,
                        color: m.id === aiModel ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                      }}>
                        <span style={{ fontSize: '12px' }}>{m.name}</span>
                        <span style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-mono)' }}>
                          ~${costPer100.toFixed(3)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: '10px', color: 'var(--color-text-quaternary)', margin: '10px 0 0 0', lineHeight: 1.5 }}>
                  Estimates only. Actual cost depends on job description lengths. It is your responsibility to monitor usage and limits on your API account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Scan Settings */}
        <div className="glass-card-solid" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--color-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon size={16} className="text-[var(--color-green-text)]" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Scan Settings</h3>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Delay between actions (seconds)
            </label>
            <input
              type="number"
              value={scanDelay}
              onChange={(e) => setScanDelay(e.target.value)}
              min={1} max={10}
              className="apple-input"
              style={{ width: '100px' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', marginTop: '6px' }}>
              Longer delays reduce risk of LinkedIn rate limiting.
            </p>
          </div>
        </div>

        {/* Save */}
        <div>
          <button
            onClick={saveSettings} disabled={saving}
            className="pill-button pill-button-primary"
            style={{ fontSize: '14px', padding: '10px 28px', opacity: saving ? 0.5 : 1 }}
          >
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Data Export/Import */}
        <div className="glass-card-solid" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DownloadIcon size={16} className="text-[var(--color-accent)]" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Data</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Export your data to transfer it to another computer, or import a previous backup. All data is included except your AI API key, which you'll need to re-enter on the new device.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => {
                const path = await window.api.data.export()
                if (path) showToast(`Data exported to ${path}`, 'success')
              }}
              className="pill-button pill-button-secondary"
              style={{ gap: '6px', fontSize: '13px', padding: '8px 18px' }}
            >
              <DownloadIcon size={14} />
              Export Data
            </button>
            <button
              onClick={() => setShowImportConfirm(true)}
              className="pill-button pill-button-secondary"
              style={{ gap: '6px', fontSize: '13px', padding: '8px 18px' }}
            >
              <UploadIcon size={14} />
              Import Data
            </button>
          </div>
        </div>

        {/* Import Confirm Dialog */}
        <Dialog
          open={showImportConfirm}
          onClose={() => setShowImportConfirm(false)}
          title="Import data?"
          description="This will replace all your current data (jobs, scores, CV, cover letters, feedback) with the data from the imported file."
        >
          <p style={{ fontSize: '13px', color: 'var(--color-red-text)', margin: '0 0 16px 0', fontWeight: 500 }}>
            This action cannot be undone. Consider exporting your current data first as a backup.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => {
                const success = await window.api.data.import()
                if (success) {
                  showToast('Data imported! Restarting...', 'success')
                }
                setShowImportConfirm(false)
              }}
              className="pill-button pill-button-primary"
              style={{ fontSize: '13px', padding: '8px 20px' }}
            >
              Import and Restart
            </button>
            <button
              onClick={() => setShowImportConfirm(false)}
              className="pill-button pill-button-secondary"
              style={{ fontSize: '13px', padding: '8px 20px' }}
            >
              Cancel
            </button>
          </div>
        </Dialog>

        {/* Disclaimer */}
        <div className="glass-card-solid" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Disclaimer</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: 0, lineHeight: 1.6 }}>
            JobSifter is a personal productivity tool that runs entirely on your computer. All data is stored locally. No data is sent to any server other than the AI provider you configure. You are solely responsible for complying with the terms of service of any third-party platforms you use with this tool, including job listing websites. The developers of JobSifter are not responsible for how you use this software. Use responsibly and respect platform rate limits and terms of service.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="glass-card-solid" style={{ padding: '24px', borderColor: 'rgba(255, 59, 48, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--color-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrashIcon size={16} className="text-[var(--color-red-text)]" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Danger Zone</h3>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="pill-button"
              style={{
                fontSize: '13px', padding: '8px 18px', gap: '6px',
                background: 'var(--color-red-soft)', color: 'var(--color-red-text)',
                border: '1px solid rgba(255, 59, 48, 0.2)'
              }}
            >
              <TrashIcon size={14} />
              Delete All My Jobs
            </button>
          ) : (
            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-red-soft)', border: '1px solid rgba(255, 59, 48, 0.2)'
            }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-red-text)', margin: '0 0 12px 0' }}>
                Are you sure? This will permanently delete all scanned jobs, scores, and match data.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDeleteAllJobs}
                  className="pill-button"
                  style={{
                    fontSize: '13px', padding: '8px 18px',
                    background: 'var(--color-red)', color: '#fff', border: 'none'
                  }}
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="pill-button pill-button-secondary"
                  style={{ fontSize: '13px', padding: '8px 18px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        </div>{/* end right column */}
      </div>
    </div>
  )
}

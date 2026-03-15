import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { CoverLetter } from '../../../shared/types'
import { ChevronLeftIcon, DownloadIcon } from '../components/icons'

type CoverLetterWithJob = CoverLetter & { jobTitle?: string; company?: string }

export default function CoverLetterEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [letter, setLetter] = useState<CoverLetterWithJob | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    window.api.coverLetters.getOne(Number(id)).then((data) => {
      const cl = data as CoverLetterWithJob
      setLetter(cl)
      setContent(cl?.content || '')
    })
  }, [id])

  const handleSave = async () => {
    if (!letter) return
    setSaving(true)
    try { await window.api.coverLetters.update(letter.id, content) }
    finally { setSaving(false) }
  }

  const handleExportPDF = async () => {
    if (!letter) return
    setExporting(true)
    try {
      await window.api.coverLetters.update(letter.id, content)
      await window.api.coverLetters.exportPdf(letter.id)
    } finally { setExporting(false) }
  }

  const wordCount = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content])

  if (!letter) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)' }}>Loading...</div>

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/cover-letters')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '20px', transition: 'opacity 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        <ChevronLeftIcon size={16} />
        Back to Cover Letters
      </button>

      <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              {letter.jobTitle || 'Cover Letter'} at {letter.company || 'Unknown'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-quaternary)', margin: '2px 0 0 0', fontVariantNumeric: 'tabular-nums' }}>
              {wordCount} words
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave} disabled={saving}
              className="pill-button pill-button-primary"
              style={{ fontSize: '13px', padding: '7px 18px', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleExportPDF} disabled={exporting}
              className="pill-button pill-button-secondary"
              style={{ fontSize: '13px', padding: '7px 18px', gap: '5px', opacity: exporting ? 0.5 : 1 }}
            >
              <DownloadIcon size={14} />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%', height: 'calc(100vh - 240px)',
            padding: '28px 32px', border: 'none', outline: 'none', resize: 'none',
            fontSize: '15px', lineHeight: 1.8, color: 'var(--color-text-primary)',
            fontFamily: 'Georgia, "Times New Roman", serif',
            background: 'transparent',
            letterSpacing: '-0.005em'
          }}
          placeholder="Cover letter content..."
        />
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { ParsedCV } from '../../../../shared/types'
import { UploadIcon, FileTextIcon } from '../icons'
import { useToast } from '../Toast'

interface CVUploaderProps {
  onUpload: (cv: ParsedCV) => void
}

export default function CVUploader({ onUpload }: CVUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const { showToast } = useToast()

  const handleUploadPDF = async () => {
    setLoading(true)
    try {
      const cv = await window.api.cv.upload()
      if (cv) {
        onUpload(cv)
        const skillCount = cv.skills?.length || 0
        const expCount = cv.experience?.length || 0
        showToast(
          `CV uploaded! Found ${skillCount} skills, ${expCount} positions${cv.name ? ` for ${cv.name}` : ''}.`,
          'success'
        )
      }
      // cv is null if user cancelled the file dialog - no message needed
    } catch (err) {
      console.error('CV upload failed:', err)
      showToast(
        `Failed to parse CV: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return
    setLoading(true)
    try {
      const cv = await window.api.cv.update({
        rawText: pasteText, name: '', email: '', phone: '',
        location: '', summary: '', skills: [], experience: [], education: []
      })
      if (cv) {
        onUpload(cv)
        showToast('CV text saved and parsed successfully.', 'success')
        setPasteMode(false)
        setPasteText('')
      }
    } catch (err) {
      console.error('CV paste failed:', err)
      showToast(
        `Failed to save CV: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleUploadPDF} disabled={loading}
          className="pill-button pill-button-primary"
          style={{ gap: '6px', fontSize: '13px', padding: '8px 18px', opacity: loading ? 0.5 : 1 }}
        >
          <UploadIcon size={15} />
          {loading ? 'Processing...' : 'Upload PDF'}
        </button>
        <button
          onClick={() => setPasteMode(!pasteMode)}
          className="pill-button pill-button-secondary"
          style={{ gap: '6px', fontSize: '13px', padding: '8px 18px' }}
        >
          <FileTextIcon size={15} />
          {pasteMode ? 'Cancel' : 'Paste Text'}
        </button>
      </div>

      {pasteMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your CV text here..."
            className="apple-input"
            style={{ height: '160px', resize: 'none', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6 }}
          />
          <button
            onClick={handlePasteSubmit}
            disabled={loading || !pasteText.trim()}
            className="pill-button"
            style={{
              gap: '6px', fontSize: '13px', padding: '8px 18px', alignSelf: 'flex-start',
              background: 'var(--color-green-soft)', color: 'var(--color-green-text)',
              border: '1px solid rgba(52, 199, 89, 0.15)',
              opacity: (loading || !pasteText.trim()) ? 0.4 : 1
            }}
          >
            Parse CV
          </button>
        </div>
      )}
    </div>
  )
}

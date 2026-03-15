import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CVUploader from '../components/cv/CVUploader'
import CVPreview from '../components/cv/CVPreview'
import { useToast } from '../components/Toast'
import Dialog from '../components/Dialog'
import type { ParsedCV } from '../../../shared/types'
import { UploadIcon, CheckCircleIcon, SparkleIcon } from '../components/icons'

export default function Resume() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [cv, setCV] = useState<ParsedCV | null>(null)
  const [cvJustUploaded, setCvJustUploaded] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackJobTitle, setFeedbackJobTitle] = useState('')
  const [feedbackCompany, setFeedbackCompany] = useState('')
  const [generatingFeedback, setGeneratingFeedback] = useState(false)

  useEffect(() => {
    window.api.cv.get().then((data) => { if (data) setCV(data) })
    window.api.settings.get().then((settings) => {
      if (settings && typeof settings === 'object') {
        setHasApiKey(!!(settings as Record<string, string>).apiKey)
      }
    })
  }, [])

  const handleCVUpload = (newCV: ParsedCV) => {
    setCV(newCV)
    setCvJustUploaded(true)
    setTimeout(() => setCvJustUploaded(false), 5000)
  }

  const handleGetFeedback = async () => {
    if (!feedbackJobTitle.trim() || !feedbackCompany.trim()) return
    setGeneratingFeedback(true)
    try {
      const result = await window.api.cvFeedback.generate(feedbackJobTitle.trim(), feedbackCompany.trim()) as { id: number }
      showToast('CV feedback generated!', 'success')
      setShowFeedbackDialog(false)
      setFeedbackJobTitle('')
      setFeedbackCompany('')
      navigate(`/cv-feedback/${result.id}`)
    } catch (err) {
      showToast(`Feedback failed: ${err instanceof Error ? err.message : 'Error'}`, 'error')
    } finally {
      setGeneratingFeedback(false)
    }
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Resume</h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
            {cv ? `${cv.name} \u00B7 ${cv.skills.length} skills \u00B7 ${cv.experience.length} positions` : 'Upload your CV to get started'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {cv && hasApiKey && (
            <button
              onClick={() => setShowFeedbackDialog(true)}
              className="pill-button"
              style={{ gap: '6px', fontSize: '13px', padding: '8px 18px', background: 'var(--color-purple-soft)', color: 'var(--color-purple)', border: '1px solid rgba(175, 82, 222, 0.15)' }}
            >
              <SparkleIcon size={14} />
              Get Resume Feedback
            </button>
          )}
          {cv && hasApiKey && <CVUploader onUpload={handleCVUpload} />}
        </div>
      </div>

      {/* Upload Success Banner */}
      {cvJustUploaded && cv && (
        <div className="page-enter" style={{
          padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '20px',
          background: 'var(--color-green-soft)', border: '1px solid rgba(52, 199, 89, 0.2)',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <CheckCircleIcon size={20} style={{ color: 'var(--color-green)', flexShrink: 0, marginTop: '1px' } as React.CSSProperties} />
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-green-text)', margin: 0 }}>
            CV uploaded and parsed successfully
          </p>
        </div>
      )}

      {/* Feedback Dialog */}
      <Dialog
        open={showFeedbackDialog}
        onClose={() => { if (!generatingFeedback) { setShowFeedbackDialog(false); setFeedbackJobTitle(''); setFeedbackCompany('') } }}
        title="Get Resume Feedback"
        description="AI will analyze your CV and give tailored improvement suggestions for this specific role."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Job Title</label>
            <input
              value={feedbackJobTitle}
              onChange={(e) => setFeedbackJobTitle(e.target.value)}
              placeholder="e.g. Product Manager, Software Engineer..."
              className="apple-input"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleGetFeedback() }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Company</label>
            <input
              value={feedbackCompany}
              onChange={(e) => setFeedbackCompany(e.target.value)}
              placeholder="e.g. Google, Spotify, Klarna..."
              className="apple-input"
              onKeyDown={(e) => { if (e.key === 'Enter') handleGetFeedback() }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleGetFeedback}
            disabled={generatingFeedback || !feedbackJobTitle.trim() || !feedbackCompany.trim()}
            className="pill-button pill-button-primary"
            style={{ fontSize: '14px', padding: '10px 24px', gap: '6px', flex: 1, opacity: (generatingFeedback || !feedbackJobTitle.trim() || !feedbackCompany.trim()) ? 0.5 : 1 }}
          >
            <SparkleIcon size={15} />
            {generatingFeedback ? <><span>Analyzing</span><span className="bounce-dots"><span>.</span><span>.</span><span>.</span></span></> : 'Get Feedback'}
          </button>
          <button
            onClick={() => { setShowFeedbackDialog(false); setFeedbackJobTitle(''); setFeedbackCompany('') }}
            disabled={generatingFeedback}
            className="pill-button pill-button-secondary"
            style={{ fontSize: '14px', padding: '10px 20px' }}
          >
            Cancel
          </button>
        </div>
      </Dialog>

      {/* No API key */}
      {!hasApiKey && (
        <div className="glass-card-solid" style={{ padding: '40px', textAlign: 'center' }}>
          <UploadIcon size={36} style={{ color: 'var(--color-text-quaternary)', margin: '0 auto 12px' } as React.CSSProperties} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Connect an AI provider in Settings first</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-quaternary)', marginTop: '4px' }}>AI is used to intelligently parse your CV</p>
        </div>
      )}

      {/* No CV yet */}
      {hasApiKey && !cv && (
        <div className="glass-card-solid" style={{ padding: '40px', textAlign: 'center' }}>
          <UploadIcon size={36} style={{ color: 'var(--color-text-quaternary)', margin: '0 auto 12px' } as React.CSSProperties} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', fontWeight: 500, marginBottom: '16px' }}>
            Upload your CV and AI will extract everything automatically
          </p>
          <CVUploader onUpload={handleCVUpload} />
        </div>
      )}

      {/* CV Content - 2 column layout */}
      {cv && (
        <div className="stagger-enter">
          {/* Edit CV Data */}
          <div style={{ marginBottom: '16px' }}>
            <CVPreview cv={cv} onUpdate={setCV} />
          </div>

          {/* Candidate Profile - full width */}
          {cv.summary && (
            <div className="glass-card-solid" style={{ padding: '20px 24px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Candidate Profile</p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.7 }}>{cv.summary}</p>
            </div>
          )}

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Contact Info */}
              <div className="glass-card-solid" style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Contact</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[['Name', cv.name], ['Email', cv.email], ['Phone', cv.phone], ['Location', cv.location]].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              {cv.skills.length > 0 && (
                <div className="glass-card-solid" style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Skills ({cv.skills.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {cv.skills.map((skill, i) => (
                      <span key={i} style={{ padding: '4px 10px', borderRadius: '980px', fontSize: '12px', fontWeight: 500, background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {cv.education.length > 0 && (
                <div className="glass-card-solid" style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Education ({cv.education.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cv.education.map((edu, i) => (
                      <div key={i} style={{ paddingLeft: '12px', borderLeft: '2px solid var(--color-border)' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>{edu.degree}</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>{edu.institution}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-quaternary)', margin: '2px 0 0 0' }}>{edu.dates}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Experience */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cv.experience.length > 0 && (
                <div className="glass-card-solid" style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                    Experience ({cv.experience.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {cv.experience.map((exp, i) => (
                      <div key={i} style={{ paddingLeft: '12px', borderLeft: '2px solid var(--color-accent)', paddingBottom: i < cv.experience.length - 1 ? '14px' : 0, borderBottom: i < cv.experience.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{exp.title}</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-accent)', margin: '2px 0 0 0', fontWeight: 500 }}>{exp.company}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-quaternary)', margin: '2px 0 0 0' }}>{exp.dates}</p>
                        {exp.description && (
                          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0', lineHeight: 1.5 }}>{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

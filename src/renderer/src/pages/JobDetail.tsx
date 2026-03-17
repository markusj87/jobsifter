import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Job } from '../../../shared/types'
import { ChevronLeftIcon, ExternalLinkIcon, BookmarkIcon, BookmarkFilledIcon, SparkleIcon } from '../components/icons'
import Dialog from '../components/Dialog'
import { scoreStyle } from '../utils/score-style'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [showCoverLetterDialog, setShowCoverLetterDialog] = useState(false)
  const [coverLetterLanguage, setCoverLetterLanguage] = useState('English')
  const [coverLetterTone, setCoverLetterTone] = useState('conversational')

  useEffect(() => {
    if (!id) return
    window.api.jobs.getOne(Number(id)).then((data) => {
      setJob(data as Job)
      setLoading(false)
    })
  }, [id])

  const handleOpenJob = () => {
    if (job?.jobUrl) window.open(job.jobUrl, '_blank')
  }

  const handleToggleBookmark = async () => {
    if (!job) return
    await window.api.jobs.update(job.id, { isBookmarked: !job.isBookmarked })
    setJob({ ...job, isBookmarked: !job.isBookmarked })
  }

  const handleScore = async () => {
    if (!job || scoring) return
    setScoring(true)
    try {
      const scored = await window.api.jobs.scoreOne(job.id) as Job
      if (scored) setJob(scored)
    } catch {
      // silently fail
    } finally {
      setScoring(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!job) return
    setShowCoverLetterDialog(false)
    setGenerating(true)
    try {
      const result = await window.api.coverLetters.generate(job.id, coverLetterLanguage, coverLetterTone)
      if (result) navigate('/cover-letters')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)' }}>Loading...</div>
  if (!job) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)' }}>Job not found</div>

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/jobs')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '20px', transition: 'opacity 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        <ChevronLeftIcon size={16} />
        Back to Jobs
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Main content */}
        <div className="stagger-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card-solid" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>{job.title}</h2>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{job.company}</p>
                <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{job.location}</p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '980px', fontSize: '14px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', ...scoreStyle(job.matchScore) }}>
                {job.matchScore ?? '--'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button onClick={handleOpenJob} className="pill-button pill-button-primary" style={{ gap: '6px', fontSize: '13px', padding: '8px 18px' }}>
                <ExternalLinkIcon size={15} />
                Open Job
              </button>
              <button onClick={handleToggleBookmark} className="pill-button pill-button-secondary" style={{ gap: '6px', fontSize: '13px', padding: '8px 18px' }}>
                {job.isBookmarked ? <BookmarkFilledIcon size={15} /> : <BookmarkIcon size={15} />}
                {job.isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                onClick={handleScore}
                disabled={job.matchScore !== null || scoring}
                className="pill-button"
                style={{
                  gap: '6px', fontSize: '13px', padding: '8px 18px',
                  background: job.matchScore !== null ? 'var(--color-surface-hover)' : 'var(--color-accent-soft)',
                  color: job.matchScore !== null ? 'var(--color-text-quaternary)' : 'var(--color-accent)',
                  border: job.matchScore !== null ? '1px solid var(--color-border)' : '1px solid rgba(0, 122, 255, 0.15)',
                  opacity: job.matchScore !== null ? 0.5 : 1,
                  cursor: job.matchScore !== null ? 'default' : 'pointer'
                }}
              >
                <SparkleIcon size={15} />
                {scoring ? <><span>Scoring</span><span className="bounce-dots"><span>.</span><span>.</span><span>.</span></span></> : job.matchScore !== null ? 'Scored' : 'Score'}
              </button>
              <button
                onClick={() => setShowCoverLetterDialog(true)}
                disabled={generating}
                className="pill-button"
                style={{
                  gap: '6px', fontSize: '13px', padding: '8px 18px',
                  background: 'var(--color-purple-soft)', color: 'var(--color-purple)',
                  border: '1px solid rgba(175, 82, 222, 0.15)',
                  opacity: generating ? 0.5 : 1
                }}
              >
                <SparkleIcon size={15} />
                {generating ? <><span>Generating</span><span className="bounce-dots"><span>.</span><span>.</span><span>.</span></span></> : 'Generate Cover Letter'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 12px 0', letterSpacing: '-0.01em' }}>Job Description</h3>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                {job.description || 'No description available.'}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {job.matchData && (
            <>
              <div className="glass-card-solid" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>Match Analysis</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{job.matchData.fitSummary}</p>
                {job.matchData.chance && (
                  <div style={{ marginTop: '12px', display: 'inline-flex', padding: '4px 12px', borderRadius: '980px', fontSize: '12px', fontWeight: 600, ...scoreStyle(job.matchScore) }}>
                    {job.matchData.chance}
                  </div>
                )}
              </div>

              {job.matchData.strengths.length > 0 && (
                <div className="glass-card-solid" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-green-text)', margin: '0 0 10px 0' }}>Strengths</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {job.matchData.strengths.map((s, i) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--color-green-text)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--color-green)', flexShrink: 0, marginTop: '2px', fontSize: '11px' }}>+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.matchData.gaps.length > 0 && (
                <div className="glass-card-solid" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-red-text)', margin: '0 0 10px 0' }}>Gaps</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {job.matchData.gaps.map((g, i) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--color-red-text)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4 }}>
                        <span style={{ flexShrink: 0, marginTop: '2px', fontSize: '11px' }}>-</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.matchData.advice && job.matchData.advice.length > 0 && (
                <div className="glass-card-solid" style={{ padding: '20px', background: 'var(--color-accent-soft)', border: '1px solid rgba(0, 113, 227, 0.1)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-accent)', margin: '0 0 10px 0' }}>Interview Advice</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {job.matchData.advice.map((tip, i) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.5 }}>
                        <span style={{ flexShrink: 0, marginTop: '1px', fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 }}>{i + 1}.</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="glass-card-solid" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 12px 0' }}>Details</h3>
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Source', (job.source || 'linkedin').charAt(0).toUpperCase() + (job.source || 'linkedin').slice(1)],
                ['Category', job.category],
                ['Easy Apply', job.easyApply ? 'Yes' : 'No'],
                ['Scanned', job.scannedAt]
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <dt style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{label}</dt>
                  <dd style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500, margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <Dialog
        open={showCoverLetterDialog}
        onClose={() => setShowCoverLetterDialog(false)}
        title="Cover Letter Options"
        description="Choose a language and tone for the generated cover letter."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Language</label>
            <select
              value={coverLetterLanguage}
              onChange={(e) => setCoverLetterLanguage(e.target.value)}
              className="apple-select"
              style={{ width: '100%', fontSize: '13px' }}
            >
              <option value="English">English</option>
              <option value="Swedish">Svenska</option>
              <option value="Norwegian">Norsk</option>
              <option value="Finnish">Suomi</option>
              <option value="Danish">Dansk</option>
              <option value="German">Deutsch</option>
              <option value="Spanish">Español</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Tone</label>
            <select
              value={coverLetterTone}
              onChange={(e) => setCoverLetterTone(e.target.value)}
              className="apple-select"
              style={{ width: '100%', fontSize: '13px' }}
            >
              <option value="professional">Professional</option>
              <option value="conversational">Conversational</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="confident">Confident</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleGenerateCoverLetter}
            className="pill-button"
            style={{
              fontSize: '14px', padding: '10px 24px', gap: '6px', flex: 1,
              background: 'var(--color-purple-soft)', color: 'var(--color-purple)',
              border: '1px solid rgba(175, 82, 222, 0.15)'
            }}
          >
            <SparkleIcon size={15} />
            Generate
          </button>
          <button
            onClick={() => setShowCoverLetterDialog(false)}
            className="pill-button pill-button-secondary"
            style={{ fontSize: '14px', padding: '10px 20px' }}
          >
            Cancel
          </button>
        </div>
      </Dialog>
    </div>
  )
}

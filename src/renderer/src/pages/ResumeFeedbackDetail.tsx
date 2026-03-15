import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { CvFeedback } from '../../../shared/types'
import { ChevronLeftIcon, SparkleIcon } from '../components/icons'

// Render inline markdown: **bold**
function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) parts.push(remaining.substring(0, boldMatch.index))
      parts.push(<strong key={key++} style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{boldMatch[1]}</strong>)
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length)
      continue
    }
    parts.push(remaining)
    break
  }

  return parts
}

// Markdown-to-JSX renderer
function renderFeedbackContent(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()

    // ### H3 headers
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={i} style={{
          fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)',
          margin: '18px 0 8px 0'
        }}>
          {renderInline(trimmed.replace('### ', ''))}
        </h4>
      )
    }

    // ## H2 headers
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={i} style={{
          fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)',
          margin: i === 0 ? '0 0 10px 0' : '24px 0 10px 0', letterSpacing: '-0.01em'
        }}>
          {renderInline(trimmed.replace('## ', ''))}
        </h3>
      )
    }

    // # H1 headers
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={i} style={{
          fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)',
          margin: i === 0 ? '0 0 12px 0' : '28px 0 12px 0', letterSpacing: '-0.01em'
        }}>
          {renderInline(trimmed.replace('# ', ''))}
        </h2>
      )
    }

    // Bullet points: - text
    if (trimmed.startsWith('- ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '4px' }}>
          <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }}>&bull;</span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{renderInline(trimmed.replace('- ', ''))}</span>
        </div>
      )
    }

    // Numbered lists: 1. text, 2. text
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      return (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '4px' }}>
          <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '1px', fontSize: '13px', fontWeight: 600, minWidth: '18px' }}>{numberedMatch[1]}.</span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{renderInline(numberedMatch[2])}</span>
        </div>
      )
    }

    // Empty line
    if (trimmed === '') return <div key={i} style={{ height: '8px' }} />

    // Regular paragraph with inline formatting
    return <p key={i} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 4px 0', lineHeight: 1.6 }}>{renderInline(trimmed)}</p>
  })
}

export default function ResumeFeedbackDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<CvFeedback | null>(null)

  useEffect(() => {
    if (!id) return
    window.api.cvFeedback.getOne(Number(id)).then((data) => {
      setFeedback(data as CvFeedback)
    })
  }, [id])

  const renderedFeedback = useMemo(() => {
    if (!feedback?.feedback) return null
    return renderFeedbackContent(feedback.feedback)
  }, [feedback?.feedback])

  if (!feedback) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)' }}>Loading...</div>

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/cv-feedback')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '20px', transition: 'opacity 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        <ChevronLeftIcon size={16} />
        Back to Resume Feedback
      </button>

      <div className="glass-card-solid" style={{ padding: '28px', maxWidth: '720px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--color-purple-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SparkleIcon size={22} className="text-[var(--color-purple)]" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {feedback.jobTitle} at {feedback.company}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '3px 0 0 0' }}>
              Feedback generated {feedback.createdAt}
            </p>
          </div>
        </div>

        <div>
          {renderedFeedback ?? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>No feedback content available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

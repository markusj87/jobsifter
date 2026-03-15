import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CvFeedback } from '../../../shared/types'
import { SparkleIcon, TrashIcon } from '../components/icons'

export default function ResumeFeedbackList() {
  const [feedbacks, setFeedbacks] = useState<CvFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    window.api.cvFeedback.getAll().then((data) => {
      setFeedbacks(data as CvFeedback[])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await window.api.cvFeedback.delete(id)
    setFeedbacks((prev) => prev.filter((f) => f.id !== id))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)' }}>Loading...</div>

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Resume Feedback
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
          {feedbacks.length} {feedbacks.length === 1 ? 'feedback' : 'feedbacks'} generated
        </p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="glass-card-solid" style={{ padding: '60px', textAlign: 'center' }}>
          <SparkleIcon size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-quaternary)' } as React.CSSProperties} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>No feedback yet</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-quaternary)', marginTop: '4px' }}>
            Go to Resume and click "Get Resume Feedback" to get AI analysis tailored to a specific role
          </p>
        </div>
      ) : (
        <div className="stagger-enter" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="glass-card-solid"
              onClick={() => navigate(`/cv-feedback/${fb.id}`)}
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'scale(1.005)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--color-purple-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SparkleIcon size={20} className="text-[var(--color-purple)]" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fb.jobTitle} at {fb.company}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '3px 0 0 0' }}>
                    {fb.createdAt}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, fb.id)}
                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-quaternary)', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-red-text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-quaternary)' }}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

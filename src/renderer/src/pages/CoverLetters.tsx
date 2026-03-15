import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CoverLetter } from '../../../shared/types'
import { DocumentIcon, TrashIcon } from '../components/icons'

type CoverLetterWithJob = CoverLetter & { jobTitle?: string; company?: string }

export default function CoverLetters() {
  const [letters, setLetters] = useState<CoverLetterWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    window.api.coverLetters.getAll().then((data) => {
      setLetters(data as CoverLetterWithJob[])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    await window.api.coverLetters.delete(id)
    setLetters((prev) => prev.filter((l) => l.id !== id))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)' }}>Loading...</div>

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Cover Letters
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
          {letters.length} {letters.length === 1 ? 'letter' : 'letters'} generated
        </p>
      </div>

      {letters.length === 0 ? (
        <div className="glass-card-solid" style={{ padding: '60px', textAlign: 'center' }}>
          <DocumentIcon size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-quaternary)' } as React.CSSProperties} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>No cover letters yet</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-quaternary)', marginTop: '4px' }}>
            Find a job match and generate a personalized cover letter
          </p>
        </div>
      ) : (
        <div className="stagger-enter" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="glass-card-solid"
              onClick={() => navigate(`/cover-letters/${letter.id}`)}
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'scale(1.005)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--color-purple-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DocumentIcon size={20} className="text-[var(--color-purple)]" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {letter.jobTitle || 'Untitled'} at {letter.company || 'Unknown'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '3px 0 0 0' }}>
                    {letter.createdAt}{letter.isEdited ? ' (edited)' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, letter.id)}
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

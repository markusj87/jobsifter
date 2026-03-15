import { useState } from 'react'
import type { ParsedCV } from '../../../../shared/types'

interface CVPreviewProps {
  cv: ParsedCV
  onUpdate: (cv: ParsedCV) => void
}

export default function CVPreview({ cv, onUpdate }: CVPreviewProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(cv)

  const handleSave = async () => {
    const updated = await window.api.cv.update(form)
    if (updated) { onUpdate(updated); setEditing(false) }
  }

  if (!editing) {
    return (
      <div className="glass-card-solid" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: 0 }}>
          Want to manually adjust the parsed data?
        </p>
        <button
          onClick={() => { setForm(cv); setEditing(true) }}
          className="pill-button pill-button-secondary"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          Edit CV Data
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card-solid" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Edit CV Data</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditing(false)} className="pill-button pill-button-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
            Cancel
          </button>
          <button onClick={handleSave} className="pill-button pill-button-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
            Save
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        {([['Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Location', 'location']] as const).map(([label, key]) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>{label}</label>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="apple-input" style={{ fontSize: '13px', padding: '8px 12px' }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Skills (comma separated)</label>
        <input
          value={form.skills.join(', ')}
          onChange={(e) => setForm({ ...form, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          className="apple-input" style={{ fontSize: '13px', padding: '8px 12px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Summary</label>
        <textarea
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          className="apple-input"
          style={{ height: '100px', resize: 'none', fontSize: '13px', padding: '8px 12px', lineHeight: 1.6 }}
        />
      </div>
    </div>
  )
}

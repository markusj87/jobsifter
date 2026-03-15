/**
 * CV repository - persistence layer for the user's uploaded CV/resume.
 */

import { getDatabase } from '../database'
import type { ParsedCV } from '../../../shared/types'

/** Retrieve the stored CV, or null if none has been uploaded. */
export function getCV(): ParsedCV | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM cv WHERE id = 1').get() as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: row.id as number,
    rawText: (row.raw_text as string) || '',
    name: (row.name as string) || '',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    location: (row.location as string) || '',
    summary: (row.summary as string) || '',
    skills: JSON.parse((row.skills as string) || '[]'),
    experience: JSON.parse((row.experience as string) || '[]'),
    education: JSON.parse((row.education as string) || '[]'),
    updatedAt: (row.updated_at as string) || ''
  }
}

/** Insert or update the CV record (always stored as id=1). */
export function upsertCV(cv: Partial<ParsedCV>): void {
  const db = getDatabase()

  const existing = db.prepare('SELECT id FROM cv WHERE id = 1').get()

  if (existing) {
    const fields: string[] = []
    const values: unknown[] = []

    if (cv.rawText !== undefined) { fields.push('raw_text = ?'); values.push(cv.rawText) }
    if (cv.name !== undefined) { fields.push('name = ?'); values.push(cv.name) }
    if (cv.email !== undefined) { fields.push('email = ?'); values.push(cv.email) }
    if (cv.phone !== undefined) { fields.push('phone = ?'); values.push(cv.phone) }
    if (cv.location !== undefined) { fields.push('location = ?'); values.push(cv.location) }
    if (cv.summary !== undefined) { fields.push('summary = ?'); values.push(cv.summary) }
    if (cv.skills !== undefined) { fields.push('skills = ?'); values.push(JSON.stringify(cv.skills)) }
    if (cv.experience !== undefined) { fields.push('experience = ?'); values.push(JSON.stringify(cv.experience)) }
    if (cv.education !== undefined) { fields.push('education = ?'); values.push(JSON.stringify(cv.education)) }

    fields.push("updated_at = datetime('now')")

    if (fields.length > 0) {
      db.prepare(`UPDATE cv SET ${fields.join(', ')} WHERE id = 1`).run(...values)
    }
  } else {
    db.prepare(`
      INSERT INTO cv (id, raw_text, name, email, phone, location, summary, skills, experience, education)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cv.rawText || '',
      cv.name || '',
      cv.email || '',
      cv.phone || '',
      cv.location || '',
      cv.summary || '',
      JSON.stringify(cv.skills || []),
      JSON.stringify(cv.experience || []),
      JSON.stringify(cv.education || [])
    )
  }
}

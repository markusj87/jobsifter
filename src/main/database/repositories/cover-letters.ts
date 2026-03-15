/**
 * Cover letters repository - CRUD operations for generated cover letters.
 */

import { getDatabase } from '../database'
import type { CoverLetter } from '../../../shared/types'

/** Insert a new cover letter for a job and return its ID. */
export function insertCoverLetter(jobId: number, content: string): number {
  const db = getDatabase()
  const result = db.prepare(
    'INSERT INTO cover_letters (job_id, content) VALUES (?, ?)'
  ).run(jobId, content)
  return Number(result.lastInsertRowid)
}

/** Get all cover letters with associated job title and company. */
export function getAllCoverLetters(): (CoverLetter & { jobTitle?: string; company?: string })[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT cl.*, j.title as job_title, j.company
    FROM cover_letters cl
    LEFT JOIN jobs j ON cl.job_id = j.id
    ORDER BY cl.created_at DESC
  `).all() as Record<string, unknown>[]

  return rows.map((row) => ({
    id: row.id as number,
    jobId: row.job_id as number,
    content: (row.content as string) || '',
    isEdited: (row.is_edited as number) === 1,
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
    jobTitle: (row.job_title as string) || '',
    company: (row.company as string) || ''
  }))
}

/** Get a single cover letter by ID with associated job info. */
export function getCoverLetter(id: number): (CoverLetter & { jobTitle?: string; company?: string }) | null {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT cl.*, j.title as job_title, j.company
    FROM cover_letters cl
    LEFT JOIN jobs j ON cl.job_id = j.id
    WHERE cl.id = ?
  `).get(id) as Record<string, unknown> | undefined

  if (!row) return null

  return {
    id: row.id as number,
    jobId: row.job_id as number,
    content: (row.content as string) || '',
    isEdited: (row.is_edited as number) === 1,
    createdAt: (row.created_at as string) || '',
    updatedAt: (row.updated_at as string) || '',
    jobTitle: (row.job_title as string) || '',
    company: (row.company as string) || ''
  }
}

/** Update the content of a cover letter and mark it as edited. */
export function updateCoverLetter(id: number, content: string): void {
  const db = getDatabase()
  db.prepare(
    "UPDATE cover_letters SET content = ?, is_edited = 1, updated_at = datetime('now') WHERE id = ?"
  ).run(content, id)
}

/** Delete a cover letter by ID. */
export function deleteCoverLetter(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM cover_letters WHERE id = ?').run(id)
}

/**
 * CV feedback repository - stores AI-generated CV improvement feedback.
 */

import { getDatabase } from '../database'

/** Row shape for CV feedback entries. */
export interface CvFeedbackRow {
  id: number
  jobTitle: string
  company: string
  feedback: string
  createdAt: string
}

/** Insert a new feedback entry and return its ID. */
export function insertFeedback(jobTitle: string, company: string, feedback: string): number {
  const db = getDatabase()
  const result = db.prepare(
    'INSERT INTO cv_feedback (job_title, company, feedback) VALUES (?, ?, ?)'
  ).run(jobTitle, company, feedback)
  return Number(result.lastInsertRowid)
}

/** Get all feedback entries, newest first. */
export function getAllFeedback(): CvFeedbackRow[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM cv_feedback ORDER BY created_at DESC').all() as Record<string, unknown>[]
  return rows.map(rowToFeedback)
}

/** Get a single feedback entry by ID. */
export function getFeedback(id: number): CvFeedbackRow | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM cv_feedback WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToFeedback(row) : null
}

/** Delete a feedback entry by ID. */
export function deleteFeedback(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM cv_feedback WHERE id = ?').run(id)
}

function rowToFeedback(row: Record<string, unknown>): CvFeedbackRow {
  return {
    id: row.id as number,
    jobTitle: (row.job_title as string) || '',
    company: (row.company as string) || '',
    feedback: (row.feedback as string) || '',
    createdAt: (row.created_at as string) || ''
  }
}

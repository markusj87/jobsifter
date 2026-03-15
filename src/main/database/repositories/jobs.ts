/**
 * Jobs repository - CRUD and query operations for scanned LinkedIn jobs.
 */

import { getDatabase } from '../database'
import type { Job, MatchResult } from '../../../shared/types'

interface InsertJobData {
  linkedinJobId: string
  title: string
  company: string
  location: string
  postedDate: string
  easyApply: boolean
  jobUrl: string
  description: string
  category: string
}

/** Insert a new job, ignoring duplicates based on linkedin_job_id. */
export function insertJob(data: InsertJobData): void {
  const db = getDatabase()
  db.prepare(`
    INSERT OR IGNORE INTO jobs (linkedin_job_id, title, company, location, posted_date, easy_apply, job_url, description, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.linkedinJobId,
    data.title,
    data.company,
    data.location,
    data.postedDate,
    data.easyApply ? 1 : 0,
    data.jobUrl,
    data.description,
    data.category
  )
}

/** Check whether a job with the given LinkedIn ID already exists. */
export function jobExists(linkedinJobId: string): boolean {
  const db = getDatabase()
  const row = db.prepare('SELECT 1 FROM jobs WHERE linkedin_job_id = ?').get(linkedinJobId)
  return !!row
}

/** Get the total number of jobs in the database. */
export function getJobCount(): number {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number }
  return row.count
}

interface JobFilters {
  minScore?: number
  maxScore?: number
  location?: string
  easyApply?: boolean
  category?: string
  isBookmarked?: boolean
  isHidden?: boolean
  sortBy?: 'match_score' | 'scanned_at' | 'company' | 'title'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/** Get jobs matching the given filters, sorted and paginated. */
export function getAllJobs(filters?: JobFilters): Job[] {
  const db = getDatabase()
  const conditions: string[] = ['is_hidden = 0']
  const params: unknown[] = []

  if (filters?.minScore !== undefined) {
    conditions.push('match_score >= ?')
    params.push(filters.minScore)
  }
  if (filters?.maxScore !== undefined) {
    conditions.push('match_score <= ?')
    params.push(filters.maxScore)
  }
  if (filters?.location) {
    conditions.push('location LIKE ?')
    params.push(`%${filters.location}%`)
  }
  if (filters?.easyApply !== undefined) {
    conditions.push('easy_apply = ?')
    params.push(filters.easyApply ? 1 : 0)
  }
  if (filters?.category) {
    conditions.push('category = ?')
    params.push(filters.category)
  }
  if (filters?.isBookmarked !== undefined) {
    conditions.push('is_bookmarked = ?')
    params.push(filters.isBookmarked ? 1 : 0)
  }

  const sortBy = filters?.sortBy || 'match_score'
  const sortOrder = filters?.sortOrder || 'desc'
  const limit = filters?.limit || 500
  const offset = filters?.offset || 0

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `SELECT * FROM jobs ${where} ORDER BY ${sortBy} ${sortOrder} NULLS LAST LIMIT ? OFFSET ?`

  const rows = db.prepare(sql).all(...params, limit, offset) as Record<string, unknown>[]
  return rows.map(rowToJob)
}

/** Get a single job by internal ID. */
export function getJob(id: number): Job | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToJob(row) : null
}

/** Update specific fields of a job (score, match data, bookmark, hidden state). */
export function updateJob(id: number, data: Partial<Job>): void {
  const db = getDatabase()
  const fields: string[] = []
  const values: unknown[] = []

  if (data.matchScore !== undefined) { fields.push('match_score = ?'); values.push(data.matchScore) }
  if (data.matchData !== undefined) { fields.push('match_data = ?'); values.push(JSON.stringify(data.matchData)) }
  if (data.isBookmarked !== undefined) { fields.push('is_bookmarked = ?'); values.push(data.isBookmarked ? 1 : 0) }
  if (data.isHidden !== undefined) { fields.push('is_hidden = ?'); values.push(data.isHidden ? 1 : 0) }

  if (fields.length > 0) {
    db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  }
}

/** Delete all jobs and related data (cover letters, CV feedback, scan sessions). */
export function deleteAllJobs(): void {
  const db = getDatabase()
  db.prepare('DELETE FROM cover_letters').run()
  db.prepare('DELETE FROM cv_feedback').run()
  db.prepare('DELETE FROM jobs').run()
  db.prepare('DELETE FROM scan_sessions').run()
}

/** Get all visible jobs that have not been scored yet. */
export function getUnscoredJobs(): Job[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM jobs WHERE match_score IS NULL AND is_hidden = 0').all() as Record<string, unknown>[]
  return rows.map(rowToJob)
}

function rowToJob(row: Record<string, unknown>): Job {
  return {
    id: row.id as number,
    linkedinJobId: (row.linkedin_job_id as string) || '',
    title: (row.title as string) || '',
    company: (row.company as string) || '',
    location: (row.location as string) || '',
    postedDate: (row.posted_date as string) || '',
    easyApply: (row.easy_apply as number) === 1,
    jobUrl: (row.job_url as string) || '',
    description: (row.description as string) || '',
    category: (row.category as string) || '',
    matchScore: row.match_score as number | null,
    matchData: row.match_data ? JSON.parse(row.match_data as string) as MatchResult : null,
    scannedAt: (row.scanned_at as string) || '',
    isBookmarked: (row.is_bookmarked as number) === 1,
    isHidden: (row.is_hidden as number) === 1
  }
}

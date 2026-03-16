/**
 * Shared interfaces for multi-platform job sources.
 * Each source (LinkedIn, Indeed, Platsbanken, RemoteOK) implements
 * the JobSource interface to provide a uniform scanning API.
 */

import type { BrowserWindow } from 'electron'

/** Parameters passed to a source's search method. */
export interface SearchParams {
  keywords: string
  location?: string
  maxPages?: number
  /** LinkedIn-specific: category IDs to scan. */
  categories?: string[]
  /** LinkedIn-specific: custom keyword+location searches. */
  customSearches?: { keywords: string; location: string }[]
}

/** A raw job extracted by a source before database insertion. */
export interface RawJob {
  externalId: string
  source: string
  title: string
  company: string
  location: string
  description: string
  jobUrl: string
  easyApply: boolean
  postedDate?: string
  category?: string
}

/** Callback for reporting scan progress and log messages. */
export type ProgressCallback = (event: ProgressEvent) => void

/** Progress event emitted during scanning. */
export interface ProgressEvent {
  type: 'progress' | 'log' | 'job'
  /** For 'progress' events. */
  jobsFound?: number
  category?: string
  currentJob?: string
  jobId?: number
  status?: 'scanning' | 'completed' | 'error'
  errorMessage?: string
  /** For 'log' events. */
  message?: string
  /** For 'job' events - the raw job that was just found. */
  job?: RawJob
}

/** A pluggable job source that can scan for jobs. */
export interface JobSource {
  /** Unique identifier for this source (e.g. 'linkedin', 'indeed'). */
  readonly id: string
  /** Display name (e.g. 'LinkedIn', 'Indeed'). */
  readonly name: string
  /** Whether this source uses a browser or a direct API. */
  readonly type: 'browser' | 'api'
  /** Whether the user must authenticate before scanning. */
  readonly requiresAuth: boolean
  /** Human-readable description shown in the UI. */
  readonly description: string
  /** Search for jobs using the given parameters. */
  search(params: SearchParams, onProgress: ProgressCallback, mainWindow: BrowserWindow): Promise<RawJob[]>
  /** Stop an in-progress search. */
  stop(): void
}

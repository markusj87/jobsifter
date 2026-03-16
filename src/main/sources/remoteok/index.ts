/**
 * RemoteOK job source - uses public JSON API.
 * No authentication or browser needed. Returns all remote jobs in a single call.
 */

import type { BrowserWindow } from 'electron'
import type { JobSource, SearchParams, RawJob, ProgressCallback } from '../types'
import * as jobsRepo from '../../database/repositories/jobs'
import { net } from 'electron'

let scanning = false

interface RemoteOKJob {
  id: string
  slug: string
  company: string
  position: string
  description: string
  location: string
  tags: string[]
  url: string
  date: string
  apply_url?: string
}

export class RemoteOKSource implements JobSource {
  readonly id = 'remoteok'
  readonly name = 'RemoteOK'
  readonly type = 'api' as const
  readonly requiresAuth = false
  readonly description = 'RemoteOK lists remote-only positions worldwide. Uses public API.'

  async search(params: SearchParams, onProgress: ProgressCallback, _mainWindow: BrowserWindow): Promise<RawJob[]> {
    if (scanning) return []
    scanning = true

    const { keywords } = params
    const allJobs: RawJob[] = []

    onProgress({ type: 'log', message: `Starting RemoteOK scan${keywords ? `: tag="${keywords}"` : ''}` })

    try {
      let url = 'https://remoteok.com/api'
      if (keywords) {
        url += `?tag=${encodeURIComponent(keywords)}`
      }

      onProgress({ type: 'log', message: `Fetching from RemoteOK API...` })

      const data = await fetchJson<(RemoteOKJob | { legal: string })[]>(url)

      // First element is usually a legal notice object, skip it
      const jobs = data.filter((item): item is RemoteOKJob => 'position' in item && 'id' in item)

      onProgress({ type: 'log', message: `Got ${jobs.length} jobs from API` })

      for (const job of jobs) {
        if (!scanning) break

        const externalId = String(job.id || job.slug)
        if (jobsRepo.jobExists(externalId)) {
          continue
        }

        const rawJob: RawJob = {
          externalId,
          source: 'remoteok',
          title: (job.position || '').substring(0, 200),
          company: (job.company || '').substring(0, 200),
          location: job.location || 'Remote',
          description: job.description || '',
          jobUrl: job.apply_url || job.url || `https://remoteok.com/l/${job.slug}`,
          easyApply: false,
          postedDate: job.date
        }

        const dbId = jobsRepo.insertJob({
          externalId: rawJob.externalId,
          source: 'remoteok',
          title: rawJob.title,
          company: rawJob.company,
          location: rawJob.location,
          postedDate: rawJob.postedDate || '',
          easyApply: false,
          jobUrl: rawJob.jobUrl,
          description: rawJob.description,
          category: job.tags?.join(', ') || ''
        })

        allJobs.push(rawJob)

        onProgress({
          type: 'progress',
          jobsFound: allJobs.length,
          currentJob: `${rawJob.title} at ${rawJob.company}`,
          jobId: dbId,
          status: 'scanning'
        })
        onProgress({ type: 'job', job: rawJob })
      }

      onProgress({ type: 'log', message: `RemoteOK scan complete: ${allJobs.length} jobs found` })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      onProgress({ type: 'log', message: `ERROR: ${errMsg}` })
      onProgress({ type: 'progress', jobsFound: allJobs.length, status: 'error', errorMessage: errMsg })
    } finally {
      scanning = false
      onProgress({ type: 'progress', jobsFound: allJobs.length, status: 'completed' })
    }

    return allJobs
  }

  stop(): void {
    scanning = false
  }
}

/** Fetch JSON from a URL using Electron's net module. */
function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    request.setHeader('Accept', 'application/json')
    request.setHeader('User-Agent', 'JobSifter/1.0')

    let body = ''
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} from ${url}`))
        return
      }
      response.on('data', (chunk) => { body += chunk.toString() })
      response.on('end', () => {
        try {
          resolve(JSON.parse(body) as T)
        } catch (e) {
          reject(new Error(`Invalid JSON from ${url}: ${e instanceof Error ? e.message : e}`))
        }
      })
    })
    request.on('error', (err) => reject(err))
    request.end()
  })
}

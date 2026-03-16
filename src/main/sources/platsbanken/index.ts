/**
 * Platsbanken (Arbetsförmedlingen) job source - uses open REST API.
 * No authentication or browser needed. Extremely fast.
 * API docs: https://jobsearch.api.jobtechdev.se/
 */

import type { BrowserWindow } from 'electron'
import type { JobSource, SearchParams, RawJob, ProgressCallback } from '../types'
import * as jobsRepo from '../../database/repositories/jobs'
import { net } from 'electron'

let scanning = false

/** Well-known municipality codes for common Swedish cities. */
const MUNICIPALITY_CODES: Record<string, string> = {
  'stockholm': '0180',
  'göteborg': '1480',
  'gothenburg': '1480',
  'malmö': '1280',
  'uppsala': '0380',
  'linköping': '0580',
  'västerås': '1980',
  'örebro': '1880',
  'norrköping': '0581',
  'helsingborg': '1283',
  'jönköping': '0680',
  'umeå': '2480',
  'lund': '1281',
  'borås': '1490',
  'sundsvall': '2281',
  'gävle': '2180',
  'karlstad': '1780',
  'växjö': '0780',
  'halmstad': '1380',
  'luleå': '2580'
}

interface PlatsbankenJob {
  id: string
  headline: string
  employer?: { name?: string }
  workplace_address?: {
    municipality?: string
    region?: string
    country?: string
  }
  description?: { text?: string }
  application_details?: { url?: string }
  webpage_url?: string
  publication_date?: string
}

interface PlatsbankenResponse {
  total: { value: number }
  hits: PlatsbankenJob[]
}

export class PlatsbankenSource implements JobSource {
  readonly id = 'platsbanken'
  readonly name = 'Platsbanken'
  readonly type = 'api' as const
  readonly requiresAuth = false
  readonly description = "Platsbanken is Sweden's official job board by Arbetsförmedlingen. Uses open API - extremely fast, no browser needed."

  async search(params: SearchParams, onProgress: ProgressCallback, _mainWindow: BrowserWindow): Promise<RawJob[]> {
    if (scanning) return []
    scanning = true

    const { keywords, location } = params
    const allJobs: RawJob[] = []
    let offset = 0
    const limit = 100

    onProgress({ type: 'log', message: `Starting Platsbanken scan: "${keywords}" in "${location || 'hela Sverige'}"` })

    try {
      // Resolve municipality code if location is provided
      const municipalityCode = location ? MUNICIPALITY_CODES[location.toLowerCase()] : undefined

      let hasMore = true
      while (scanning && hasMore) {
        let url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(keywords)}&limit=${limit}&offset=${offset}`
        if (municipalityCode) {
          url += `&municipality=${municipalityCode}`
        }

        onProgress({ type: 'log', message: `Fetching offset=${offset}...` })

        const data = await fetchJson<PlatsbankenResponse>(url)
        const totalJobs = data.total.value

        onProgress({ type: 'log', message: `Total available: ${totalJobs}, got ${data.hits.length} in this batch` })

        if (data.hits.length === 0) {
          hasMore = false
          break
        }

        for (const hit of data.hits) {
          if (!scanning) break

          const externalId = hit.id
          if (jobsRepo.jobExists(externalId)) continue

          const loc = [
            hit.workplace_address?.municipality,
            hit.workplace_address?.region,
            hit.workplace_address?.country
          ].filter(Boolean).join(', ')

          const rawJob: RawJob = {
            externalId,
            source: 'platsbanken',
            title: (hit.headline || '').substring(0, 200),
            company: (hit.employer?.name || '').substring(0, 200),
            location: loc.substring(0, 200),
            description: hit.description?.text || '',
            jobUrl: hit.webpage_url || hit.application_details?.url || `https://arbetsformedlingen.se/platsbanken/annonser/${externalId}`,
            easyApply: false,
            postedDate: hit.publication_date
          }

          const dbId = jobsRepo.insertJob({
            externalId: rawJob.externalId,
            source: 'platsbanken',
            title: rawJob.title,
            company: rawJob.company,
            location: rawJob.location,
            postedDate: rawJob.postedDate || '',
            easyApply: false,
            jobUrl: rawJob.jobUrl,
            description: rawJob.description,
            category: ''
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

        offset += limit
        hasMore = offset < totalJobs

        onProgress({ type: 'log', message: `Batch done: ${allJobs.length} new jobs so far` })
      }

      onProgress({ type: 'log', message: `Platsbanken scan complete: ${allJobs.length} jobs found` })
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

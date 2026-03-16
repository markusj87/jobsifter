/**
 * Indeed job source - browser-based scanning, no authentication required.
 * Uses Playwright to navigate Indeed search results and extract job details.
 */

import type { BrowserWindow } from 'electron'
import type { JobSource, SearchParams, RawJob, ProgressCallback } from '../types'
import { playwrightManager } from '../../browser/playwright-manager'
import { randomDelay } from '../../browser/scroll-utils'
import * as jobsRepo from '../../database/repositories/jobs'
import { SELECTORS } from './selectors'

let scanning = false

export class IndeedSource implements JobSource {
  readonly id = 'indeed'
  readonly name = 'Indeed'
  readonly type = 'browser' as const
  readonly requiresAuth = false
  readonly description = 'Indeed jobs are publicly available. No login required.'

  async search(params: SearchParams, onProgress: ProgressCallback, _mainWindow: BrowserWindow): Promise<RawJob[]> {
    if (scanning) return []
    scanning = true

    const { keywords, location, maxPages = 10 } = params
    const allJobs: RawJob[] = []

    onProgress({ type: 'log', message: `Starting Indeed scan: "${keywords}" in "${location || 'anywhere'}"` })

    try {
      const page = await playwrightManager.getPage()

      for (let pageNum = 0; pageNum < maxPages; pageNum++) {
        if (!scanning) break

        const start = pageNum * 10
        const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}${location ? '&l=' + encodeURIComponent(location) : ''}&start=${start}`

        onProgress({ type: 'log', message: `Loading page ${pageNum + 1}: ${searchUrl}` })

        try {
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
        } catch (navError) {
          onProgress({ type: 'log', message: `Navigation failed: ${navError instanceof Error ? navError.message : navError}` })
          break
        }

        await randomDelay(2000, 3000)

        // Extract job cards from search results
        const jobCards = await page.evaluate((sel) => {
          const cards: { id: string; title: string; company: string; location: string; url: string }[] = []
          const elements = document.querySelectorAll(sel.JOB_CARD)

          for (const el of elements) {
            const titleEl = el.querySelector(sel.TITLE) as HTMLAnchorElement | null
            const companyEl = el.querySelector(sel.COMPANY)
            const locationEl = el.querySelector(sel.LOCATION)

            const href = titleEl?.getAttribute('href') || ''
            const idMatch = href.match(/jk=([a-f0-9]+)/) || href.match(/\/viewjob\?jk=([a-f0-9]+)/)
            const jobId = idMatch?.[1] || ''

            if (jobId && titleEl) {
              cards.push({
                id: jobId,
                title: titleEl.textContent?.trim() || '',
                company: companyEl?.textContent?.trim() || '',
                location: locationEl?.textContent?.trim() || '',
                url: href.startsWith('http') ? href : `https://www.indeed.com${href}`
              })
            }
          }
          return cards
        }, SELECTORS)

        onProgress({ type: 'log', message: `Found ${jobCards.length} jobs on page ${pageNum + 1}` })

        if (jobCards.length === 0) {
          onProgress({ type: 'log', message: 'No more jobs found, stopping' })
          break
        }

        // Navigate to each job page to extract the full description
        for (const card of jobCards) {
          if (!scanning) break

          if (jobsRepo.jobExists(card.id)) {
            onProgress({ type: 'log', message: `Skipping ${card.id} (already scanned)` })
            continue
          }

          let description = ''
          try {
            const jobUrl = `https://www.indeed.com/viewjob?jk=${card.id}`
            await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
            await randomDelay(1500, 2500)

            description = await page.evaluate((sel) => {
              // Try multiple selectors for the job description
              const selectors = sel.DESCRIPTION.split(', ')
              for (const s of selectors) {
                const el = document.querySelector(s.trim())
                if (el) {
                  const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || ''
                  if (text.length > 30) return text
                }
              }
              // Fallback: look for any large text block in the page
              const allDivs = document.querySelectorAll('div[id*="jobDescription"], div[class*="jobDescription"], div[class*="description"]')
              for (const div of allDivs) {
                const text = (div as HTMLElement).innerText?.trim() || ''
                if (text.length > 100) return text
              }
              return ''
            }, SELECTORS)

            onProgress({ type: 'log', message: `Job ${card.id}: got ${description.length} chars of description` })
          } catch (err) {
            onProgress({ type: 'log', message: `Job ${card.id}: failed to fetch description - ${err instanceof Error ? err.message : err}` })
          }

          const rawJob: RawJob = {
            externalId: card.id,
            source: 'indeed',
            title: card.title.substring(0, 200),
            company: card.company.substring(0, 200),
            location: card.location.substring(0, 200),
            description,
            jobUrl: `https://www.indeed.com/viewjob?jk=${card.id}`,
            easyApply: false
          }

          const dbId = jobsRepo.insertJob({
            externalId: rawJob.externalId,
            source: 'indeed',
            title: rawJob.title,
            company: rawJob.company,
            location: rawJob.location,
            postedDate: '',
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

          await randomDelay(1500, 2500)
        }

        // Navigate back to search results for next page
        onProgress({ type: 'log', message: `Page ${pageNum + 1} done: ${jobCards.length} jobs processed` })
        await randomDelay(2000, 3000)
      }

      onProgress({ type: 'log', message: `Indeed scan complete: ${allJobs.length} jobs found` })
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      onProgress({ type: 'log', message: `FATAL ERROR: ${errMsg}` })
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

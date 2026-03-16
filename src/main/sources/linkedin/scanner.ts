/**
 * LinkedIn job scanner.
 * Orchestrates the scanning process: navigates categories, collects job IDs,
 * extracts details via side panel or detail page, and returns raw jobs.
 */

import type { Page } from 'playwright'
import type { BrowserWindow } from 'electron'
import { playwrightManager } from '../../browser/playwright-manager'
import { scrollJobListToBottom, randomDelay } from '../../browser/scroll-utils'
import { extractFromSidePanel, extractFromDetailPage } from '../../browser/extractor'
import { clickNextPage } from '../../browser/pagination'
import { LINKEDIN_BASE_URL, LINKEDIN_CATEGORIES, SCAN_DEFAULTS } from '../../../shared/constants'
import * as jobsRepo from '../../database/repositories/jobs'
import type { SearchParams, RawJob, ProgressCallback } from '../types'

let scanning = false

/** Check whether a LinkedIn scan is currently in progress. */
export function isLinkedInScanning(): boolean {
  return scanning
}

/** Stop the current LinkedIn scan gracefully. */
export function stopLinkedInScan(): void {
  scanning = false
}

/**
 * Start scanning LinkedIn job listings.
 * Iterates through custom searches and selected categories, extracting
 * job details from each page and saving them to the database.
 */
export async function startLinkedInScan(
  params: SearchParams,
  onProgress: ProgressCallback,
  _mainWindow: BrowserWindow
): Promise<RawJob[]> {
  if (scanning) return []
  scanning = true

  const categoryIds = params.categories || []
  const customSearches = params.customSearches || []
  const categories = LINKEDIN_CATEGORIES.filter((c) => categoryIds.includes(c.id))
  const allJobs: RawJob[] = []

  onProgress({ type: 'log', message: `Starting scan: ${customSearches.length} custom searches, ${categories.length} categories` })

  try {
    const page = await playwrightManager.getPage()

    // Run custom searches first
    for (const search of customSearches) {
      if (!scanning) break
      onProgress({ type: 'log', message: `=== Search: "${search.keywords}" in "${search.location || 'anywhere'}" ===` })
      const searchUrl = `/jobs/search/?keywords=${encodeURIComponent(search.keywords)}${search.location ? '&location=' + encodeURIComponent(search.location) : ''}`
      const categoryId = `search: ${search.keywords}${search.location ? ' (' + search.location + ')' : ''}`
      const jobs = await scanCategory(page, categoryId, searchUrl, onProgress)
      allJobs.push(...jobs)
      await randomDelay(3000, 5000)
    }

    // Then run category scans
    for (const category of categories) {
      if (!scanning) break
      onProgress({ type: 'log', message: `=== Category: ${category.name} ===` })
      const jobs = await scanCategory(page, category.id, category.url, onProgress)
      allJobs.push(...jobs)
      await randomDelay(3000, 5000)
    }

    onProgress({ type: 'log', message: 'Scan finished successfully' })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    onProgress({ type: 'log', message: `FATAL ERROR: ${errMsg}` })
    onProgress({
      type: 'progress',
      jobsFound: allJobs.length,
      category: '',
      currentJob: '',
      status: 'error',
      errorMessage: errMsg
    })
  } finally {
    scanning = false
    onProgress({
      type: 'progress',
      jobsFound: allJobs.length,
      category: '',
      currentJob: '',
      status: 'completed'
    })
  }

  return allJobs
}

/** Scan a single category or search URL across multiple pages. */
async function scanCategory(
  page: Page,
  categoryId: string,
  categoryUrl: string,
  onProgress: ProgressCallback
): Promise<RawJob[]> {
  let currentPage = 1
  const maxPages = 20
  const jobs: RawJob[] = []

  const fullUrl = `${LINKEDIN_BASE_URL}${categoryUrl}`
  onProgress({ type: 'log', message: `Loading: ${fullUrl}` })

  try {
    await page.goto(fullUrl, { waitUntil: 'load', timeout: 30000 })
  } catch (navError) {
    onProgress({ type: 'log', message: `Navigation failed: ${navError instanceof Error ? navError.message : navError}` })
    return jobs
  }

  await randomDelay(3000, 5000)

  while (scanning && currentPage <= maxPages) {
    onProgress({ type: 'log', message: `Processing page ${currentPage}...` })

    const scrollResult = await scrollJobListToBottom(page)
    onProgress({ type: 'log', message: `Scroll container: ${scrollResult.containerInfo}` })
    onProgress({ type: 'log', message: `Scrolling loaded ${scrollResult.jobCount} jobs` })
    await randomDelay(1000, 1500)

    const jobIds = await page.evaluate(() => {
      const ids: string[] = []
      const seen = new Set<string>()
      const links = document.querySelectorAll('a[href*="/jobs/view/"]')
      for (const a of links) {
        const href = a.getAttribute('href') || ''
        const match = href.match(/\/jobs\/view\/(\d+)/)
        if (match && !seen.has(match[1])) {
          seen.add(match[1])
          ids.push(match[1])
        }
      }
      return ids
    })

    onProgress({ type: 'log', message: `Found ${jobIds.length} jobs on page ${currentPage}` })

    if (jobIds.length === 0) {
      onProgress({ type: 'log', message: 'No jobs found, moving to next category' })
      break
    }

    let savedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (let i = 0; i < jobIds.length; i++) {
      if (!scanning) break
      const jobId = jobIds[i]

      if (jobsRepo.jobExists(jobId)) {
        skippedCount++
        if (skippedCount <= 3) onProgress({ type: 'log', message: `Skipping job ${jobId} (already scanned)` })
        continue
      }

      try {
        const currentUrl = page.url()
        if (!currentUrl.includes('/jobs/collections/') && !currentUrl.includes('/jobs/search/')) {
          onProgress({ type: 'log', message: `Wrong page detected (${currentUrl}), navigating back...` })
          await page.goto(`${LINKEDIN_BASE_URL}${categoryUrl}`, { waitUntil: 'load', timeout: 30000 })
          await randomDelay(3000, 4000)
          await scrollJobListToBottom(page)
          await randomDelay(1000, 1500)
        }

        const clickResult = await page.evaluate((id) => {
          const link = document.querySelector(`a[href*="/jobs/view/${id}"]`) as HTMLElement | null
          if (!link) return 'not_found'
          link.scrollIntoView({ behavior: 'instant', block: 'center' })
          link.click()
          return 'clicked'
        }, jobId)

        if (clickResult === 'not_found') {
          onProgress({ type: 'log', message: `Job ${jobId}: link not found in DOM, skipping` })
          errorCount++
          continue
        }

        await randomDelay(2500, 3500)

        const urlAfterClick = page.url()
        let details: { title: string; company: string; location: string; description: string; easyApply: boolean }

        if (urlAfterClick.includes(`/jobs/view/${jobId}`) && !urlAfterClick.includes('/collections/') && !urlAfterClick.includes('/search/') && !urlAfterClick.includes('currentJobId=')) {
          onProgress({ type: 'log', message: `Job ${jobId}: navigated to detail page, extracting there` })
          details = await extractFromDetailPage(page)
          await page.goto(`${LINKEDIN_BASE_URL}${categoryUrl}`, { waitUntil: 'load', timeout: 30000 })
          await randomDelay(2000, 3000)
          await scrollJobListToBottom(page)
          await randomDelay(1000, 1500)
        } else {
          details = await extractFromSidePanel(page)
        }

        const rawJob: RawJob = {
          externalId: jobId,
          source: 'linkedin',
          title: (details.title || '').substring(0, 200),
          company: (details.company || '').substring(0, 200),
          location: (details.location || '').substring(0, 200),
          description: details.description || '',
          jobUrl: `${LINKEDIN_BASE_URL}/jobs/view/${jobId}/`,
          easyApply: details.easyApply,
          postedDate: '',
          category: categoryId
        }

        const dbId = jobsRepo.insertJob({
          externalId: rawJob.externalId,
          source: 'linkedin',
          title: rawJob.title,
          company: rawJob.company,
          location: rawJob.location,
          postedDate: '',
          easyApply: rawJob.easyApply,
          jobUrl: rawJob.jobUrl,
          description: rawJob.description,
          category: categoryId
        })

        jobs.push(rawJob)
        savedCount++

        onProgress({
          type: 'progress',
          category: categoryId,
          jobsFound: savedCount,
          currentJob: `${details.title} at ${details.company}`,
          jobId: dbId,
          status: 'scanning'
        })
        onProgress({ type: 'job', job: rawJob })

        await randomDelay(SCAN_DEFAULTS.delayBetweenJobs, SCAN_DEFAULTS.delayBetweenJobs + 1500)
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        onProgress({ type: 'log', message: `Job ${jobId}: ERROR - ${errMsg}` })
        errorCount++

        try {
          const currentUrl = page.url()
          if (!currentUrl.includes('/jobs/collections/') && !currentUrl.includes('/jobs/search/')) {
            await page.goto(`${LINKEDIN_BASE_URL}${categoryUrl}`, { waitUntil: 'load', timeout: 30000 })
            await randomDelay(3000, 4000)
            await scrollJobListToBottom(page)
            await randomDelay(1000, 1500)
          }
        } catch {
          onProgress({ type: 'log', message: 'Recovery failed, continuing...' })
        }

        await randomDelay(1000, 2000)
        continue
      }
    }

    onProgress({ type: 'log', message: `Page ${currentPage} done: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors` })

    const hasNextPage = await clickNextPage(page, currentPage)
    if (!hasNextPage) {
      onProgress({ type: 'log', message: `No page ${currentPage + 1} button found, category done` })
      break
    }

    currentPage++
    onProgress({ type: 'log', message: `Navigating to page ${currentPage}...` })
    await randomDelay(SCAN_DEFAULTS.delayBetweenPages, SCAN_DEFAULTS.delayBetweenPages + 2000)
  }

  onProgress({ type: 'log', message: `Category ${categoryId} complete` })
  return jobs
}

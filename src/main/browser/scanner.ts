/**
 * LinkedIn job scanner.
 * Orchestrates the scanning process: navigates categories, collects job IDs,
 * extracts details via side panel or detail page, and persists results.
 */

import type { Page } from 'playwright'
import type { BrowserWindow } from 'electron'
import { playwrightManager } from './playwright-manager'
import { scrollJobListToBottom, randomDelay } from './scroll-utils'
import { extractFromSidePanel, extractFromDetailPage } from './extractor'
import { clickNextPage } from './pagination'
import { LINKEDIN_BASE_URL, LINKEDIN_CATEGORIES, SCAN_DEFAULTS } from '../../shared/constants'
import * as jobsRepo from '../database/repositories/jobs'
import type { ScanProgress } from '../../shared/types'
import { IPC_CHANNELS } from '../../shared/ipc'

let scanning = false
let mainWin: BrowserWindow | null = null

function log(msg: string): void {
  console.log(`[Scanner] ${msg}`)
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send(IPC_CHANNELS.SCAN_LOG, msg)
  }
}

/** Check whether a scan is currently in progress. */
export function isScanning(): boolean {
  return scanning
}

export interface CustomSearch {
  keywords: string
  location: string
}

/**
 * Start scanning LinkedIn job listings.
 * Iterates through custom searches and selected categories, extracting
 * job details from each page and saving them to the database.
 */
export async function startScan(
  categoryIds: string[],
  mainWindow: BrowserWindow,
  customSearches?: CustomSearch[]
): Promise<void> {
  if (scanning) return
  scanning = true
  mainWin = mainWindow

  const categories = LINKEDIN_CATEGORIES.filter((c) => categoryIds.includes(c.id))
  const searches = customSearches || []
  log(`Starting scan: ${searches.length} custom searches, ${categories.length} categories`)

  try {
    const page = await playwrightManager.getPage()

    // Run custom searches first
    for (const search of searches) {
      if (!scanning) break
      log(`=== Search: "${search.keywords}" in "${search.location || 'anywhere'}" ===`)
      const searchUrl = `/jobs/search/?keywords=${encodeURIComponent(search.keywords)}${search.location ? '&location=' + encodeURIComponent(search.location) : ''}`
      const categoryId = `search: ${search.keywords}${search.location ? ' (' + search.location + ')' : ''}`
      await scanCategory(page, categoryId, searchUrl, mainWindow)
      await randomDelay(3000, 5000)
    }

    // Then run category scans
    for (const category of categories) {
      if (!scanning) break
      log(`=== Category: ${category.name} ===`)
      await scanCategory(page, category.id, category.url, mainWindow)
      await randomDelay(3000, 5000)
    }

    log('Scan finished successfully')
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    log(`FATAL ERROR: ${errMsg}`)
    sendProgress(mainWindow, {
      category: '',
      jobsFound: jobsRepo.getJobCount(),
      currentJob: '',
      status: 'error',
      errorMessage: errMsg
    })
  } finally {
    scanning = false
    sendProgress(mainWindow, {
      category: '',
      jobsFound: jobsRepo.getJobCount(),
      currentJob: '',
      status: 'completed'
    })
  }
}

/** Stop the current scan gracefully. */
export function stopScan(): void {
  scanning = false
  log('Scan stopped by user')
}

/** Scan a single category or search URL across multiple pages. */
async function scanCategory(
  page: Page,
  categoryId: string,
  categoryUrl: string,
  mainWindow: BrowserWindow
): Promise<void> {
  let currentPage = 1
  const maxPages = 20

  // Navigate to the category page first
  const fullUrl = `${LINKEDIN_BASE_URL}${categoryUrl}`
  log(`Loading: ${fullUrl}`)

  try {
    await page.goto(fullUrl, { waitUntil: 'load', timeout: 30000 })
  } catch (navError) {
    log(`Navigation failed: ${navError instanceof Error ? navError.message : navError}`)
    return
  }

  await randomDelay(3000, 5000)

  while (scanning && currentPage <= maxPages) {
    log(`Processing page ${currentPage}...`)

    // Scroll to load ALL cards (LinkedIn lazy-loads ~7 at a time)
    const scrollResult = await scrollJobListToBottom(page)
    log(`Scroll container: ${scrollResult.containerInfo}`)
    log(`Scrolling loaded ${scrollResult.jobCount} jobs`)
    await randomDelay(1000, 1500)

    // Collect all job IDs from the page
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

    log(`Found ${jobIds.length} jobs on page ${currentPage}`)

    if (jobIds.length === 0) {
      log('No jobs found, moving to next category')
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
        if (skippedCount <= 3) log(`Skipping job ${jobId} (already scanned)`)
        continue
      }

      try {
        // First check we're still on the right page
        const currentUrl = page.url()
        if (!currentUrl.includes('/jobs/collections/') && !currentUrl.includes('/jobs/search/')) {
          log(`Wrong page detected (${currentUrl}), navigating back...`)
          await page.goto(`${LINKEDIN_BASE_URL}${categoryUrl}`, { waitUntil: 'load', timeout: 30000 })
          await randomDelay(3000, 4000)
          await scrollJobListToBottom(page)
          await randomDelay(1000, 1500)
        }

        // Click the job link using JavaScript (doesn't navigate away)
        const clickResult = await page.evaluate((id) => {
          const link = document.querySelector(`a[href*="/jobs/view/${id}"]`) as HTMLElement | null
          if (!link) return 'not_found'

          // Scroll the card into view
          link.scrollIntoView({ behavior: 'instant', block: 'center' })

          // Click it
          link.click()
          return 'clicked'
        }, jobId)

        if (clickResult === 'not_found') {
          log(`Job ${jobId}: link not found in DOM, skipping`)
          errorCount++
          continue
        }

        // Wait for detail panel to update
        await randomDelay(2500, 3500)

        // Check if we accidentally navigated to a new page
        const urlAfterClick = page.url()
        if (urlAfterClick.includes(`/jobs/view/${jobId}`) && !urlAfterClick.includes('/collections/') && !urlAfterClick.includes('/search/') && !urlAfterClick.includes('currentJobId=')) {
          // We navigated to the job page - extract from there and go back
          log(`Job ${jobId}: navigated to detail page, extracting there`)

          const details = await extractFromDetailPage(page)

          jobsRepo.insertJob({
            externalId: jobId,
            source: 'linkedin',
            title: (details.title || '').substring(0, 200),
            company: (details.company || '').substring(0, 200),
            location: (details.location || '').substring(0, 200),
            postedDate: '',
            easyApply: details.easyApply,
            jobUrl: `${LINKEDIN_BASE_URL}/jobs/view/${jobId}/`,
            description: details.description || '',
            category: categoryId
          })

          savedCount++
          sendProgress(mainWindow, {
            category: categoryId,
            jobsFound: jobsRepo.getJobCount(),
            currentJob: `${details.title} at ${details.company}`,
            status: 'scanning'
          })

          // Go back to the list
          await page.goto(`${LINKEDIN_BASE_URL}${categoryUrl}`, { waitUntil: 'load', timeout: 30000 })
          await randomDelay(2000, 3000)
          await scrollJobListToBottom(page)
          await randomDelay(1000, 1500)

        } else {
          // We stayed on the list page - extract from the side panel
          const details = await extractFromSidePanel(page)

          jobsRepo.insertJob({
            externalId: jobId,
            source: 'linkedin',
            title: (details.title || '').substring(0, 200),
            company: (details.company || '').substring(0, 200),
            location: (details.location || '').substring(0, 200),
            postedDate: '',
            easyApply: details.easyApply,
            jobUrl: `${LINKEDIN_BASE_URL}/jobs/view/${jobId}/`,
            description: details.description || '',
            category: categoryId
          })

          savedCount++
          sendProgress(mainWindow, {
            category: categoryId,
            jobsFound: jobsRepo.getJobCount(),
            currentJob: `${details.title} at ${details.company}`,
            status: 'scanning'
          })
        }

        // Rate limiting
        await randomDelay(SCAN_DEFAULTS.delayBetweenJobs, SCAN_DEFAULTS.delayBetweenJobs + 1500)

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        log(`Job ${jobId}: ERROR - ${errMsg}`)
        errorCount++

        // Try to recover - make sure we're on the right page
        try {
          const currentUrl = page.url()
          if (!currentUrl.includes('/jobs/collections/') && !currentUrl.includes('/jobs/search/')) {
            await page.goto(`${LINKEDIN_BASE_URL}${categoryUrl}`, { waitUntil: 'load', timeout: 30000 })
            await randomDelay(3000, 4000)
            await scrollJobListToBottom(page)
            await randomDelay(1000, 1500)
          }
        } catch {
          log('Recovery failed, continuing...')
        }

        await randomDelay(1000, 2000)
        continue
      }
    }

    log(`Page ${currentPage} done: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`)

    // Try to click the next page button
    const hasNextPage = await clickNextPage(page, currentPage)
    if (!hasNextPage) {
      log(`No page ${currentPage + 1} button found, category done`)
      break
    }

    currentPage++
    log(`Navigating to page ${currentPage}...`)
    await randomDelay(SCAN_DEFAULTS.delayBetweenPages, SCAN_DEFAULTS.delayBetweenPages + 2000)
  }

  log(`Category ${categoryId} complete`)
}

/** Send scan progress update to the renderer process. */
function sendProgress(mainWindow: BrowserWindow, progress: ScanProgress): void {
  if (!mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress)
  }
}

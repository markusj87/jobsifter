/**
 * LinkedIn job list pagination.
 * Handles clicking the next page button using multiple strategies
 * to account for LinkedIn's varying DOM structures.
 */

import type { Page } from 'playwright'
import { randomDelay } from './scroll-utils'

/**
 * Attempt to click the next page button in LinkedIn's job list pagination.
 * Tries multiple selector strategies to handle varying DOM structures.
 * @returns true if the next page button was found and clicked, false otherwise.
 */
export async function clickNextPage(page: Page, currentPage: number): Promise<boolean> {
  const nextPageNum = currentPage + 1

  try {
    // Scroll pagination into view first
    await page.evaluate(() => {
      const pagination = document.querySelector('.artdeco-pagination')
        || document.querySelector('[class*="pagination"]')
      if (pagination) {
        pagination.scrollIntoView({ behavior: 'instant', block: 'center' })
      }
    })
    await randomDelay(500, 800)

    // Try to find and click the next page button
    const clicked = await page.evaluate((nextNum) => {
      // Strategy 1: Find button with aria-label "Page X"
      const ariaBtn = document.querySelector(`button[aria-label="Page ${nextNum}"]`) as HTMLElement | null
      if (ariaBtn && !ariaBtn.hasAttribute('disabled')) {
        ariaBtn.click()
        return `aria-label Page ${nextNum}`
      }

      // Strategy 2: Find pagination buttons and match by text content
      const allButtons = document.querySelectorAll('.artdeco-pagination__indicator--number button')
      for (const btn of allButtons) {
        if (btn.textContent?.trim() === String(nextNum)) {
          ;(btn as HTMLElement).click()
          return `text content ${nextNum}`
        }
      }

      // Strategy 3: Any button/li in pagination with the right number
      const paginationItems = document.querySelectorAll('[class*="pagination"] button, [class*="pagination"] li')
      for (const item of paginationItems) {
        const text = item.textContent?.trim()
        if (text === String(nextNum)) {
          ;(item as HTMLElement).click()
          return `pagination item ${nextNum}`
        }
      }

      // Strategy 4: Look for a "next" button
      const nextBtns = document.querySelectorAll('button[aria-label*="next" i], button[aria-label*="Next" i], button[aria-label*="Nästa" i]')
      if (nextBtns.length > 0) {
        ;(nextBtns[0] as HTMLElement).click()
        return 'next button'
      }

      return null
    }, nextPageNum)

    if (clicked) {
      console.log(`[Scanner] Clicked pagination: ${clicked}`)

      // Wait for new page to load
      await randomDelay(3000, 4000)

      // Verify we actually got new content by waiting for the page to settle
      await page.waitForLoadState('networkidle').catch(() => {})
      await randomDelay(1000, 2000)

      return true
    }

    return false
  } catch (error) {
    console.error('[Scanner] Pagination click error:', error)
    return false
  }
}

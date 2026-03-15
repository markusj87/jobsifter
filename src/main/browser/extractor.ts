/**
 * Job detail extraction from LinkedIn pages.
 * Extracts title, company, location, description, and Easy Apply status
 * from both the side panel view and the full detail page.
 */

import type { Page } from 'playwright'
import { randomDelay } from './scroll-utils'

/** Extracted job details from a LinkedIn job listing. */
export interface JobDetails {
  title: string
  company: string
  location: string
  description: string
  easyApply: boolean
}

/** Extract job details from the side panel on the LinkedIn jobs search page. */
export async function extractFromSidePanel(page: Page): Promise<JobDetails> {
  return await page.evaluate(() => {
    const getText = (...selectors: string[]): string => {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel)
          const text = el?.textContent?.trim()
          if (text && text.length > 0) return text
        } catch { /* skip */ }
      }
      return ''
    }

    const getDescription = (): string => {
      const selectors = [
        '.jobs-description__content',
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '#job-details',
        '[class*="description__text"]',
        '.jobs-description'
      ]
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel)
          if (el) {
            const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || ''
            if (text.length > 50) return text
          }
        } catch { /* skip */ }
      }

      // Fallback: get text from the detail container
      const detail = document.querySelector('.scaffold-layout__detail')
        || document.querySelector('.jobs-search__job-details--container')
      if (detail) {
        const text = (detail as HTMLElement).innerText || ''
        if (text.length > 200) return text
      }

      return ''
    }

    const title = getText(
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      '.t-24.t-bold'
    )

    const company = getText(
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container a'
    )

    const location = getText(
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet'
    )

    const description = getDescription()

    const applyBtn = document.querySelector('.jobs-apply-button')
    const applyText = applyBtn?.textContent?.trim().toLowerCase() || ''
    const easyApply = applyText.includes('easy apply') || applyText.includes('enkel ansökan')

    return { title, company, location, description, easyApply }
  })
}

/** Extract job details from a full LinkedIn job detail page (navigated away from list). */
export async function extractFromDetailPage(page: Page): Promise<JobDetails> {
  // Same extraction but on a full job detail page
  await randomDelay(1000, 2000)
  return await extractFromSidePanel(page) // Same selectors work on both
}

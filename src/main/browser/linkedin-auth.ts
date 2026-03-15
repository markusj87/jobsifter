/**
 * LinkedIn browser session management.
 * Handles login page navigation, session detection, and browser cleanup.
 */

import { playwrightManager } from './playwright-manager'
import { LINKEDIN_BASE_URL } from '../../shared/constants'

/** Open the LinkedIn login page in the managed Playwright browser. */
export async function openLinkedInLogin(): Promise<void> {
  const page = await playwrightManager.getPage()
  await page.goto(`${LINKEDIN_BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
}

/** Check whether a valid LinkedIn session exists (via URL or cookie). */
export async function checkLinkedInSession(): Promise<boolean> {
  if (!playwrightManager.isRunning()) return false

  try {
    const page = await playwrightManager.getPage()
    const url = page.url()

    // Check current URL - don't navigate away from where the user is
    if (url.includes('/feed') || url.includes('/mynetwork') || url.includes('/jobs') || url.includes('/messaging')) {
      return true
    }

    // If still on login page, check if there's a session cookie instead of navigating
    const cookies = await page.context().cookies('https://www.linkedin.com')
    const hasSession = cookies.some((c) => c.name === 'li_at')
    return hasSession
  } catch {
    return false
  }
}

/** Close the managed Playwright browser instance. */
export async function closeLinkedIn(): Promise<void> {
  await playwrightManager.close()
}

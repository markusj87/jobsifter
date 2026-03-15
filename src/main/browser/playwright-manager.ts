/**
 * Playwright browser lifecycle manager.
 * Manages a persistent Chromium context with anti-detection measures.
 * Uses bundled Chromium from extraResources in production,
 * or the default Playwright install in development.
 */

import { chromium, type BrowserContext, type Page } from 'playwright'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'

/** Locate the Chromium executable, checking bundled location first. */
function findChromiumPath(): string | undefined {
  // In production: Chromium is bundled in extraResources/playwright-browsers/
  const resourcesPath = process.resourcesPath
  const bundledDir = join(resourcesPath, 'playwright-browsers')

  if (existsSync(bundledDir)) {
    // Find the chromium directory (e.g. chromium-1208)
    const entries = readdirSync(bundledDir).filter(e => e.startsWith('chromium'))
    if (entries.length > 0) {
      const chromiumDir = join(bundledDir, entries[0])

      // Platform-specific executable paths
      if (process.platform === 'darwin') {
        // Try arm64 first, then x64
        const paths = [
          join(chromiumDir, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
          join(chromiumDir, 'chrome-mac', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
          join(chromiumDir, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
        ]
        for (const p of paths) {
          if (existsSync(p)) return p
        }
      } else if (process.platform === 'win32') {
        const winPath = join(chromiumDir, 'chrome-win64', 'chrome.exe')
        if (existsSync(winPath)) return winPath
        const winPath2 = join(chromiumDir, 'chrome-win', 'chrome.exe')
        if (existsSync(winPath2)) return winPath2
      } else {
        const linuxPath = join(chromiumDir, 'chrome-linux64', 'chrome')
        if (existsSync(linuxPath)) return linuxPath
        const linuxPath2 = join(chromiumDir, 'chrome-linux', 'chrome')
        if (existsSync(linuxPath2)) return linuxPath2
      }

      console.log('[Playwright] Bundled chromium dir found but no executable:', chromiumDir)
    }
  }

  // In development: use default Playwright install
  try {
    const defaultPath = chromium.executablePath()
    if (existsSync(defaultPath)) return defaultPath
  } catch { /* not installed */ }

  return undefined
}

class PlaywrightManager {
  private context: BrowserContext | null = null
  private userDataDir: string

  constructor() {
    this.userDataDir = join(app.getPath('userData'), 'linkedin-browser-profile')
  }

  async launch(): Promise<BrowserContext> {
    if (this.context) return this.context

    const executablePath = findChromiumPath()
    if (!executablePath) {
      throw new Error(
        'Chromium browser not found. If running from source, run: npx playwright install chromium'
      )
    }

    console.log('[Playwright] Using Chromium at:', executablePath)

    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
      executablePath,
      viewport: { width: 1280, height: 900 },
      locale: 'en-US',
      args: [
        '--disable-blink-features=AutomationControlled'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    })

    this.context.on('close', () => {
      this.context = null
    })

    return this.context
  }

  async getPage(): Promise<Page> {
    const ctx = await this.launch()
    const pages = ctx.pages()
    return pages[0] || await ctx.newPage()
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close()
      this.context = null
    }
  }

  isRunning(): boolean {
    return this.context !== null
  }
}

export const playwrightManager = new PlaywrightManager()

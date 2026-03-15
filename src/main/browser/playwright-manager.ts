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

/** Recursively search for a file by name, optionally requiring a parent directory name. */
function findFileRecursive(dir: string, filename: string, parentHint?: string, depth = 0): string | undefined {
  if (depth > 8) return undefined
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isFile() && entry.name === filename) {
        if (!parentHint || dir.includes(parentHint)) return fullPath
      }
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const found = findFileRecursive(fullPath, filename, parentHint, depth + 1)
        if (found) return found
      }
    }
  } catch { /* permission errors etc */ }
  return undefined
}

/** Locate the Chromium executable, checking bundled location first. */
function findChromiumPath(): string | undefined {
  // In production: Chromium is bundled in extraResources/playwright-browsers/
  const resourcesPath = process.resourcesPath
  const bundledDir = join(resourcesPath, 'playwright-browsers')

  if (existsSync(bundledDir)) {
    // Search recursively for the executable in the bundled directory
    if (process.platform === 'darwin') {
      const macExecutable = findFileRecursive(bundledDir, 'Google Chrome for Testing', 'MacOS')
      if (macExecutable) return macExecutable
    } else if (process.platform === 'win32') {
      const winExecutable = findFileRecursive(bundledDir, 'chrome.exe', 'chrome-win')
      if (winExecutable) return winExecutable
    } else {
      const linuxExecutable = findFileRecursive(bundledDir, 'chrome', 'chrome-linux')
      if (linuxExecutable) return linuxExecutable
    }

    console.log('[Playwright] Bundled dir exists but no executable found in:', bundledDir)
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

/**
 * Playwright browser lifecycle manager.
 * Manages a persistent Chromium context with anti-detection measures.
 *
 * On Windows: Chromium is bundled in extraResources (no download needed).
 * On macOS/Linux: Auto-installs Chromium on first use if not found.
 */

import { chromium, type BrowserContext, type Page } from 'playwright'
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { IPC_CHANNELS } from '../../shared/ipc'

/** Recursively find a file by name within a directory. */
function findFile(dir: string, filename: string, depth = 0): string | undefined {
  if (depth > 8) return undefined
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isFile() && entry.name === filename) return fullPath
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const found = findFile(fullPath, filename, depth + 1)
        if (found) return found
      }
    }
  } catch { /* skip */ }
  return undefined
}

/** Find Chromium executable - checks bundled location first, then default Playwright install. */
function findChromiumPath(): string | undefined {
  // Check bundled location (Windows production builds)
  const bundledDir = join(process.resourcesPath, 'playwright-browsers')
  if (existsSync(bundledDir)) {
    const exe = process.platform === 'win32'
      ? findFile(bundledDir, 'chrome.exe')
      : findFile(bundledDir, 'Google Chrome for Testing')
    if (exe) {
      console.log('[Playwright] Found bundled Chromium:', exe)
      return exe
    }
  }

  // Check default Playwright install
  try {
    const defaultPath = chromium.executablePath()
    if (existsSync(defaultPath)) {
      console.log('[Playwright] Found installed Chromium:', defaultPath)
      return defaultPath
    }
  } catch { /* not installed */ }

  return undefined
}

/** Install Chromium using Playwright's registry API directly. */
async function installChromium(): Promise<void> {
  console.log('[Playwright] Installing Chromium via registry API...')
  try {
    // Use Playwright's internal registry to download Chromium
    const { Registry } = require('playwright-core/lib/server/registry') as {
      Registry: new (browsersJSON: string) => {
        install(browserNames: string[], forceReinstall: boolean): Promise<void>
      }
    }
    const path = require('path')
    const browsersJSON = path.join(path.dirname(require.resolve('playwright-core')), 'browsers.json')
    const registry = new Registry(browsersJSON)
    await registry.install(['chromium'], false)
    console.log('[Playwright] Chromium installed successfully')
  } catch (err) {
    console.error('[Playwright] Registry install failed:', err)
    // Fallback: try spawning node directly
    try {
      await installChromiumViaSpawn()
    } catch (spawnErr) {
      console.error('[Playwright] Spawn install also failed:', spawnErr)
      throw new Error('Could not install browser automatically. On macOS, open Terminal and run: npx playwright install chromium')
    }
  }
}

/** Fallback: install via spawning npx. */
function installChromiumViaSpawn(): Promise<void> {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process')
    console.log('[Playwright] Trying npx install...')
    const child = spawn('npx', ['playwright', 'install', 'chromium'], {
      shell: true,
      timeout: 300000,
      stdio: 'pipe'
    })

    child.stdout?.on('data', (data: Buffer) => console.log('[Playwright]', data.toString().trim()))
    child.stderr?.on('data', (data: Buffer) => console.log('[Playwright]', data.toString().trim()))

    child.on('close', (code: number) => {
      if (code === 0) resolve()
      else reject(new Error(`npx playwright install exited with code ${code}`))
    })

    child.on('error', reject)
  })
}

/** Send a log message to the renderer's scan log. */
function sendLog(msg: string): void {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0 && !windows[0].isDestroyed()) {
    windows[0].webContents.send(IPC_CHANNELS.SCAN_LOG, msg)
  }
}

/** Send browser install status to the renderer. */
function sendBrowserStatus(status: 'installing' | 'installed' | 'error', message: string): void {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0 && !windows[0].isDestroyed()) {
    windows[0].webContents.send(IPC_CHANNELS.BROWSER_STATUS, { status, message })
  }
}

class PlaywrightManager {
  private context: BrowserContext | null = null
  private userDataDir: string
  private installing = false

  constructor() {
    this.userDataDir = join(app.getPath('userData'), 'linkedin-browser-profile')
  }

  async launch(): Promise<BrowserContext> {
    if (this.context) return this.context

    let executablePath = findChromiumPath()

    // Auto-install if not found (primarily for macOS where bundling doesn't work)
    if (!executablePath) {
      if (this.installing) {
        throw new Error('Browser is currently being installed. Please wait...')
      }
      this.installing = true
      sendLog('Browser not found. Downloading Chromium (~170MB), this only happens once...')
      sendBrowserStatus('installing', 'Downloading browser (~170MB). This only happens once...')
      try {
        await installChromium()
        sendLog('Chromium installed successfully!')
        sendBrowserStatus('installed', 'Browser ready!')
        executablePath = findChromiumPath()
      } catch (err) {
        sendBrowserStatus('error', err instanceof Error ? err.message : 'Failed to install browser')
        throw err
      } finally {
        this.installing = false
      }
    }

    if (!executablePath) {
      throw new Error('Chromium browser not found. Please open a terminal and run: npx playwright install chromium')
    }

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

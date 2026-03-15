import { chromium, type BrowserContext, type Page } from 'playwright'
import { app } from 'electron'
import { join } from 'path'

class PlaywrightManager {
  private context: BrowserContext | null = null
  private userDataDir: string

  constructor() {
    this.userDataDir = join(app.getPath('userData'), 'linkedin-browser-profile')
  }

  async launch(): Promise<BrowserContext> {
    if (this.context) return this.context

    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: false,
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

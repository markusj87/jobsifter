/**
 * IPC handlers for job scanning and browser session management.
 * Supports multiple sources (LinkedIn, Indeed, Platsbanken, RemoteOK).
 */

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import { openLinkedInLogin, checkLinkedInSession, closeLinkedIn } from '../browser/linkedin-auth'
import { getSource, getSourcesInfo } from '../sources/registry'
import type { SearchParams, ProgressCallback } from '../sources/types'
import type { CustomSearch } from '../browser/scanner'

/** Track the currently active source so we can stop it. */
let activeSourceId: string | null = null

/** Register IPC handlers for scan start/stop and LinkedIn session management. */
export function registerScanHandlers(getMainWindow: () => BrowserWindow | null): void {
  /** Open the LinkedIn login page in the managed browser. */
  ipcMain.handle(IPC_CHANNELS.LINKEDIN_OPEN, async () => {
    await openLinkedInLogin()
  })

  /** Check whether a valid LinkedIn session exists. */
  ipcMain.handle(IPC_CHANNELS.LINKEDIN_CHECK_SESSION, async () => {
    return await checkLinkedInSession()
  })

  /** Close the managed LinkedIn browser instance. */
  ipcMain.handle(IPC_CHANNELS.LINKEDIN_CLOSE, async () => {
    await closeLinkedIn()
  })

  /** Get list of all available job sources. */
  ipcMain.handle(IPC_CHANNELS.SOURCES_LIST, () => {
    return getSourcesInfo()
  })

  /**
   * Start scanning with a specific source.
   * New unified handler: takes { sourceId, params }.
   */
  ipcMain.handle(IPC_CHANNELS.SCAN_START, async (_, sourceId: string, params: SearchParams) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const source = getSource(sourceId)
    if (!source) throw new Error(`Unknown source: ${sourceId}`)

    activeSourceId = sourceId

    const onProgress: ProgressCallback = (event) => {
      if (mainWindow.isDestroyed()) return

      if (event.type === 'progress') {
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, {
          category: event.category || '',
          jobsFound: event.jobsFound || 0,
          currentJob: event.currentJob || '',
          jobId: event.jobId,
          status: event.status || 'scanning',
          errorMessage: event.errorMessage
        })
      } else if (event.type === 'log') {
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_LOG, event.message || '')
      }
    }

    try {
      await source.search(params, onProgress, mainWindow)
    } finally {
      activeSourceId = null
    }
  })

  /**
   * LinkedIn-specific scan start - backwards compatible with existing UI.
   * Takes (categories, customSearches) and routes to LinkedIn source.
   */
  ipcMain.handle(IPC_CHANNELS.SCAN_START_LINKEDIN, async (_, categories: string[], customSearches?: CustomSearch[]) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return

    const source = getSource('linkedin')
    if (!source) throw new Error('LinkedIn source not found')

    activeSourceId = 'linkedin'

    const onProgress: ProgressCallback = (event) => {
      if (mainWindow.isDestroyed()) return
      if (event.type === 'progress') {
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, {
          category: event.category || '',
          jobsFound: event.jobsFound || 0,
          currentJob: event.currentJob || '',
          jobId: event.jobId,
          status: event.status || 'scanning',
          errorMessage: event.errorMessage
        })
      } else if (event.type === 'log') {
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_LOG, event.message || '')
      }
    }

    const params: SearchParams = {
      keywords: '',
      categories,
      customSearches
    }

    try {
      await source.search(params, onProgress, mainWindow)
    } finally {
      activeSourceId = null
    }
  })

  /** Stop an in-progress scan for any source. */
  ipcMain.handle(IPC_CHANNELS.SCAN_STOP, () => {
    if (activeSourceId) {
      const source = getSource(activeSourceId)
      if (source) source.stop()
    }
  })
}

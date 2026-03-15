/**
 * IPC handlers for LinkedIn scanning and browser session management.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import { openLinkedInLogin, checkLinkedInSession, closeLinkedIn } from '../browser/linkedin-auth'
import { startScan, stopScan, type CustomSearch } from '../browser/scanner'

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

  /** Start scanning LinkedIn job listings for selected categories and custom searches. */
  ipcMain.handle(IPC_CHANNELS.SCAN_START, async (_, categories: string[], customSearches?: CustomSearch[]) => {
    const mainWindow = getMainWindow()
    if (!mainWindow) return
    await startScan(categories, mainWindow, customSearches)
  })

  /** Stop an in-progress scan. */
  ipcMain.handle(IPC_CHANNELS.SCAN_STOP, () => {
    stopScan()
  })
}

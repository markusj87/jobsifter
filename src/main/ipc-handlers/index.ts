/**
 * Central IPC handler registration.
 * Imports all handler modules and registers them with a single call.
 */

import type { BrowserWindow } from 'electron'
import { registerCvHandlers } from './cv'
import { registerJobsHandlers } from './jobs'
import { registerScanHandlers } from './scan'
import { registerCoverLettersHandlers } from './cover-letters'
import { registerCvFeedbackHandlers } from './cv-feedback'
import { registerSettingsHandlers } from './settings'

/**
 * Register all IPC handlers for the application.
 * @param getMainWindow - Accessor returning the current main BrowserWindow (or null).
 */
export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  registerCvHandlers(getMainWindow)
  registerJobsHandlers(getMainWindow)
  registerScanHandlers(getMainWindow)
  registerCoverLettersHandlers(getMainWindow)
  registerCvFeedbackHandlers(getMainWindow)
  registerSettingsHandlers(getMainWindow)
}

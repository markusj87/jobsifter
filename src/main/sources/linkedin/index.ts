/**
 * LinkedIn job source - browser-based scanning with authentication.
 * Wraps the existing scanner to conform to the JobSource interface.
 */

import type { BrowserWindow } from 'electron'
import type { JobSource, SearchParams, RawJob, ProgressCallback } from '../types'
import { startLinkedInScan, stopLinkedInScan, isLinkedInScanning } from './scanner'

export class LinkedInSource implements JobSource {
  readonly id = 'linkedin'
  readonly name = 'LinkedIn'
  readonly type = 'browser' as const
  readonly requiresAuth = true
  readonly description = 'Scan LinkedIn job listings. Requires login and uses browser automation.'

  async search(params: SearchParams, onProgress: ProgressCallback, mainWindow: BrowserWindow): Promise<RawJob[]> {
    return startLinkedInScan(params, onProgress, mainWindow)
  }

  stop(): void {
    stopLinkedInScan()
  }
}

export { isLinkedInScanning }

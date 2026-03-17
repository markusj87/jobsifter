/**
 * IPC handlers for application settings and AI model listing.
 */

import { ipcMain, BrowserWindow, dialog, app } from 'electron'
import { copyFileSync } from 'fs'
import { join } from 'path'
import { IPC_CHANNELS } from '../../shared/ipc'
import { getSetting, setSetting, getAllSettings } from '../database/repositories/settings'
import { closeDatabase } from '../database/database'
import { aiService, CLAUDE_MODELS, OPENAI_MODELS, GEMINI_MODELS, MISTRAL_MODELS } from '../ai/ai-service'
import type { AIProvider } from '../../shared/types'

/** Register IPC handlers for settings get/set and AI model listing. */
export function registerSettingsHandlers(_getMainWindow: () => BrowserWindow | null): void {
  /** Get a single setting by key, or all settings if no key is provided. */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_, key?: string) => {
    if (key) return getSetting(key)
    return getAllSettings()
  })

  /** Persist a setting and reconfigure the AI service if credentials change. */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, key: string, value: string) => {
    setSetting(key, value)
    if (key === 'aiProvider' || key === 'apiKey' || key === 'aiModel') {
      const provider = getSetting('aiProvider') as AIProvider || 'none'
      const apiKey = getSetting('apiKey') || ''
      const model = getSetting('aiModel') || undefined
      if (provider !== 'none' && apiKey) {
        aiService.configure(provider, apiKey, model)
      }
    }
  })

  /** Return the list of available models for a given AI provider. */
  ipcMain.handle(IPC_CHANNELS.AI_GET_MODELS, (_, provider: AIProvider) => {
    if (provider === 'claude') return CLAUDE_MODELS
    if (provider === 'openai') return OPENAI_MODELS
    if (provider === 'gemini') return GEMINI_MODELS
    if (provider === 'mistral') return MISTRAL_MODELS
    return []
  })

  /** Export the database to a user-chosen location. */
  ipcMain.handle(IPC_CHANNELS.DATA_EXPORT, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const date = new Date().toISOString().split('T')[0]
    const result = await dialog.showSaveDialog(win, {
      title: 'Export JobSifter Data',
      defaultPath: `jobsifter-backup-${date}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }]
    })

    if (result.canceled || !result.filePath) return null

    const dbPath = join(app.getPath('userData'), 'jobsifter.db')
    copyFileSync(dbPath, result.filePath)

    // Remove API key from the exported copy for security
    const Database = require('better-sqlite3')
    const exportDb = new Database(result.filePath)
    exportDb.prepare("DELETE FROM settings WHERE key = 'apiKey'").run()
    exportDb.close()

    return result.filePath
  })

  /** Import a database file, replacing the current data. Restarts the app. */
  ipcMain.handle(IPC_CHANNELS.DATA_IMPORT, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false

    const result = await dialog.showOpenDialog(win, {
      title: 'Import JobSifter Data',
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return false

    const importPath = result.filePaths[0]
    const dbPath = join(app.getPath('userData'), 'jobsifter.db')

    closeDatabase()
    copyFileSync(importPath, dbPath)

    // Restart the app to load the new database
    app.relaunch()
    app.quit()
    return true
  })
}

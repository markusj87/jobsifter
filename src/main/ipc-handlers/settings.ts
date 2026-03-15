/**
 * IPC handlers for application settings and AI model listing.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import { getSetting, setSetting, getAllSettings } from '../database/repositories/settings'
import { aiService, CLAUDE_MODELS, OPENAI_MODELS } from '../ai/ai-service'
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
    return []
  })
}

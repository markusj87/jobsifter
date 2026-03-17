/**
 * IPC handlers for CV upload, retrieval, and update operations.
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import { PDFParse } from 'pdf-parse'
import { IPC_CHANNELS } from '../../shared/ipc'
import { getCV, upsertCV } from '../database/repositories/cv'
import { ensureAI, aiService } from '../ai/ai-service'
import { getSetting } from '../database/repositories/settings'
import { CV_PARSE_PROMPT, formatPrompt } from '../ai/prompts'
import { parseJsonObject } from '../ai/parse-ai-response'
import type { ParsedCV } from '../../shared/types'

/** Register IPC handlers for CV upload, get, and update. */
export function registerCvHandlers(_getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.CV_UPLOAD, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    ensureAI()

    const result = await dialog.showOpenDialog(win, {
      title: 'Select CV / Resume',
      filters: [
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Text', extensions: ['txt'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    console.log('[CV Upload] File selected:', filePath)

    let rawText: string

    try {
      if (filePath.toLowerCase().endsWith('.pdf')) {
        const buffer = readFileSync(filePath)
        console.log('[CV Upload] PDF buffer size:', buffer.length)
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        await parser.load()
        const textResult = await parser.getText()
        rawText = textResult.text
        console.log('[CV Upload] Extracted text length:', rawText.length)
        parser.destroy()
      } else {
        rawText = readFileSync(filePath, 'utf-8')
      }
    } catch (err) {
      console.error('[CV Upload] Failed to read/parse file:', err)
      throw new Error(`Could not read file: ${err instanceof Error ? err.message : String(err)}`)
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text could be extracted from the file. The PDF might be image-based (scanned).')
    }

    // Use AI to parse the CV
    console.log('[CV Upload] Sending to AI for parsing...')
    const language = getSetting('aiLanguage') || 'English'
    const prompt = formatPrompt(CV_PARSE_PROMPT, { raw_text: rawText, language })
    const aiResponse = await aiService.complete(prompt)

    const parsed = parseJsonObject(aiResponse)
    if (!parsed) {
      throw new Error('AI could not parse the CV. Please try again.')
    }

    console.log('[CV Upload] AI parsed result:', {
      name: parsed.name,
      skills: (parsed.skills as string[])?.length || 0,
      experience: (parsed.experience as unknown[])?.length || 0
    })

    upsertCV({
      rawText,
      name: (parsed.name as string) || '',
      email: (parsed.email as string) || '',
      phone: (parsed.phone as string) || '',
      location: (parsed.location as string) || '',
      summary: (parsed.summary as string) || '',
      skills: (parsed.skills as string[]) || [],
      experience: (parsed.experience as ParsedCV['experience']) || [],
      education: (parsed.education as ParsedCV['education']) || []
    })

    return getCV()
  })

  /** Retrieve the stored CV. */
  ipcMain.handle(IPC_CHANNELS.CV_GET, () => {
    return getCV()
  })

  /** Update specific fields of the stored CV. */
  ipcMain.handle(IPC_CHANNELS.CV_UPDATE, (_, data: Partial<ParsedCV>) => {
    upsertCV(data)
    return getCV()
  })
}

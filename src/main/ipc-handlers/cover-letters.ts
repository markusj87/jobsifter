/**
 * IPC handlers for cover letter generation, CRUD operations, and PDF export.
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import * as jobsRepo from '../database/repositories/jobs'
import * as coverLettersRepo from '../database/repositories/cover-letters'
import { getCV } from '../database/repositories/cv'
import { ensureAI, aiService } from '../ai/ai-service'
import { COVER_LETTER_PROMPT, formatPrompt, formatCVForPrompt } from '../ai/prompts'
import { generateCoverLetterPDF } from '../pdf/pdf-generator'

/** Register IPC handlers for cover letter generation, retrieval, update, delete, and PDF export. */
export function registerCoverLettersHandlers(_getMainWindow: () => BrowserWindow | null): void {
  /** Generate a new cover letter for a job using AI. */
  ipcMain.handle(IPC_CHANNELS.AI_GENERATE_COVER_LETTER, async (_, jobId: number) => {
    ensureAI()

    const job = jobsRepo.getJob(jobId)
    const cv = getCV()
    if (!job || !cv) return null

    const prompt = formatPrompt(COVER_LETTER_PROMPT, {
      cv_data: formatCVForPrompt(cv),
      job_description: job.description,
      company: job.company,
      job_title: job.title
    })

    const content = await aiService.complete(prompt)
    const id = coverLettersRepo.insertCoverLetter(jobId, content)
    return coverLettersRepo.getCoverLetter(id)
  })

  /** Get all cover letters with associated job info. */
  ipcMain.handle(IPC_CHANNELS.COVER_LETTERS_GET_ALL, () => {
    return coverLettersRepo.getAllCoverLetters()
  })

  /** Get a single cover letter by ID. */
  ipcMain.handle(IPC_CHANNELS.COVER_LETTERS_GET_ONE, (_, id: number) => {
    return coverLettersRepo.getCoverLetter(id)
  })

  /** Update the content of a cover letter. */
  ipcMain.handle(IPC_CHANNELS.COVER_LETTERS_UPDATE, (_, id: number, content: string) => {
    coverLettersRepo.updateCoverLetter(id, content)
  })

  /** Delete a cover letter by ID. */
  ipcMain.handle(IPC_CHANNELS.COVER_LETTERS_DELETE, (_, id: number) => {
    coverLettersRepo.deleteCoverLetter(id)
  })

  /** Export a cover letter as a formatted PDF file. */
  ipcMain.handle(IPC_CHANNELS.COVER_LETTERS_EXPORT_PDF, async (event, id: number) => {
    const cl = coverLettersRepo.getCoverLetter(id)
    const cv = getCV()
    if (!cl || !cv) return null

    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null

    const result = await dialog.showSaveDialog(window, {
      title: 'Export Cover Letter as PDF',
      defaultPath: `cover-letter-${cl.company || 'unknown'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (result.canceled || !result.filePath) return null

    await generateCoverLetterPDF(cl.content, cv, result.filePath)
    return result.filePath
  })
}

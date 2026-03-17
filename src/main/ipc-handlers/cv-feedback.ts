/**
 * IPC handlers for CV feedback generation, retrieval, and deletion.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import { getCV } from '../database/repositories/cv'
import * as jobsRepo from '../database/repositories/jobs'
import * as cvFeedbackRepo from '../database/repositories/cv-feedback'
import { ensureAI, aiService } from '../ai/ai-service'
import { getSetting } from '../database/repositories/settings'
import { CV_FEEDBACK_PROMPT, CV_FEEDBACK_JOB_PROMPT, formatPrompt, formatCVForPrompt } from '../ai/prompts'

/** Register IPC handlers for CV feedback generation, listing, detail, and deletion. */
export function registerCvFeedbackHandlers(_getMainWindow: () => BrowserWindow | null): void {
  /** Generate CV feedback for a given job title and company using AI. */
  ipcMain.handle(IPC_CHANNELS.CV_FEEDBACK_GENERATE, async (_, jobTitle: string, company: string) => {
    ensureAI()
    const cv = getCV()
    if (!cv) throw new Error('No CV uploaded.')

    const language = getSetting('aiLanguage') || 'English'
    const prompt = formatPrompt(CV_FEEDBACK_PROMPT, {
      cv_data: formatCVForPrompt(cv),
      job_title: jobTitle,
      company: company,
      language
    })

    const feedback = await aiService.complete(prompt)
    const id = cvFeedbackRepo.insertFeedback(jobTitle, company, feedback)
    return cvFeedbackRepo.getFeedback(id)
  })

  /** Generate CV feedback using a stored job's full description. */
  ipcMain.handle(IPC_CHANNELS.CV_FEEDBACK_GENERATE_FROM_JOB, async (_, jobId: number) => {
    ensureAI()
    const cv = getCV()
    if (!cv) throw new Error('No CV uploaded.')
    const job = jobsRepo.getJob(jobId)
    if (!job) throw new Error('Job not found.')

    const language = getSetting('aiLanguage') || 'English'
    const prompt = formatPrompt(CV_FEEDBACK_JOB_PROMPT, {
      cv_data: formatCVForPrompt(cv),
      job_title: job.title,
      company: job.company,
      job_description: job.description,
      language
    })

    const feedback = await aiService.complete(prompt)
    console.log(`[CV Feedback] Job ${jobId}: title="${job.title}", company="${job.company}", feedback length=${feedback.length}`)
    const id = cvFeedbackRepo.insertFeedback(job.title, job.company, feedback)
    const saved = cvFeedbackRepo.getFeedback(id)
    console.log(`[CV Feedback] Saved id=${id}, retrieved feedback length=${saved?.feedback?.length}`)
    return saved
  })

  /** Get all CV feedback entries. */
  ipcMain.handle(IPC_CHANNELS.CV_FEEDBACK_GET_ALL, () => {
    return cvFeedbackRepo.getAllFeedback()
  })

  /** Get a single CV feedback entry by ID. */
  ipcMain.handle(IPC_CHANNELS.CV_FEEDBACK_GET_ONE, (_, id: number) => {
    return cvFeedbackRepo.getFeedback(id)
  })

  /** Delete a CV feedback entry by ID. */
  ipcMain.handle(IPC_CHANNELS.CV_FEEDBACK_DELETE, (_, id: number) => {
    cvFeedbackRepo.deleteFeedback(id)
  })
}

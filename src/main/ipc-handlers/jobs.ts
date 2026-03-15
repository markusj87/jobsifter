/**
 * IPC handlers for job listing, scoring, and management operations.
 */

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc'
import * as jobsRepo from '../database/repositories/jobs'
import { getCV } from '../database/repositories/cv'
import { ensureAI, aiService } from '../ai/ai-service'
import { JOB_MATCH_BATCH_PROMPT, formatPrompt, formatCVForPrompt } from '../ai/prompts'
import { parseJsonArray } from '../ai/parse-ai-response'

/** Shape of a single score result returned by the AI (snake_case fields from AI, camelCase from TS). */
interface AIScoreResult {
  job_id: string
  match_score?: number
  score?: number
  strengths: string[]
  gaps: string[]
  fit_summary?: string
  fitSummary?: string
  chance?: string
  advice?: string[]
}

/** Register IPC handlers for job retrieval, updates, deletion, and AI scoring. */
export function registerJobsHandlers(_getMainWindow: () => BrowserWindow | null): void {
  /** Get all jobs with optional filters. */
  ipcMain.handle(IPC_CHANNELS.JOBS_GET_ALL, (_, filters) => {
    return jobsRepo.getAllJobs(filters)
  })

  /** Get a single job by ID. */
  ipcMain.handle(IPC_CHANNELS.JOBS_GET_ONE, (_, id: number) => {
    return jobsRepo.getJob(id)
  })

  /** Update job fields by ID. */
  ipcMain.handle(IPC_CHANNELS.JOBS_UPDATE, (_, id: number, data) => {
    jobsRepo.updateJob(id, data)
  })

  /** Score a single job against the uploaded CV using AI. */
  ipcMain.handle(IPC_CHANNELS.JOBS_SCORE_ONE, async (_, jobId: number) => {
    ensureAI()
    const cv = getCV()
    if (!cv) throw new Error('No CV uploaded.')

    const job = jobsRepo.getJob(jobId)
    if (!job) throw new Error('Job not found.')

    const cvSummary = formatCVForPrompt(cv)
    const jobsForPrompt = [{
      job_id: String(job.id),
      title: job.title,
      company: job.company,
      description: job.description.substring(0, 2000)
    }]

    const prompt = formatPrompt(JOB_MATCH_BATCH_PROMPT, {
      cv_data: cvSummary,
      jobs_json: JSON.stringify(jobsForPrompt, null, 2)
    })

    const response = await aiService.complete(prompt)
    const results = parseJsonArray(response) as AIScoreResult[] | null
    if (results) {
      const result = results[0]
      if (result) {
        jobsRepo.updateJob(jobId, {
          matchScore: result.match_score ?? result.score,
          matchData: {
            score: result.match_score ?? result.score ?? 0,
            strengths: result.strengths || [],
            gaps: result.gaps || [],
            fitSummary: result.fit_summary ?? result.fitSummary ?? '',
            chance: result.chance,
            advice: result.advice || []
          }
        })
        return jobsRepo.getJob(jobId)
      }
    }
    throw new Error('AI did not return a valid score.')
  })

  /** Get the count of jobs that have not been scored yet. */
  ipcMain.handle(IPC_CHANNELS.JOBS_UNSCORED_COUNT, () => {
    return jobsRepo.getUnscoredJobs().length
  })

  /** Delete all jobs, cover letters, CV feedback, and scan sessions. */
  ipcMain.handle(IPC_CHANNELS.JOBS_DELETE_ALL, () => {
    jobsRepo.deleteAllJobs()
  })

  /** Score all unscored jobs in batched parallel waves using AI. */
  ipcMain.handle(IPC_CHANNELS.JOBS_SCORE_ALL, async (event) => {
    ensureAI()

    const cv = getCV()
    if (!cv) throw new Error('No CV uploaded. Upload your CV first.')

    const win = BrowserWindow.fromWebContents(event.sender)
    const unscoredJobs = jobsRepo.getUnscoredJobs()
    const total = unscoredJobs.length

    if (total === 0) return { scored: 0, errors: 0, total: 0, inputTokens: 0, outputTokens: 0 }

    aiService.resetTokens()

    const sendScoreProgress = (current: number, jobTitle: string, error?: string) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.JOBS_SCORE_PROGRESS, {
          current, total, jobTitle, error,
          inputTokens: aiService.totalInputTokens,
          outputTokens: aiService.totalOutputTokens
        })
      }
    }

    // Batch jobs - 10 per AI call, 5 parallel requests
    const BATCH_SIZE = 10
    const PARALLEL = 5
    const cvSummary = formatCVForPrompt(cv)
    let scored = 0
    let errors = 0

    // Split into batches of 10
    const batches: typeof unscoredJobs[] = []
    for (let i = 0; i < unscoredJobs.length; i += BATCH_SIZE) {
      batches.push(unscoredJobs.slice(i, i + BATCH_SIZE))
    }

    console.log(`[Score All] Scoring ${total} jobs: ${batches.length} batches, ${PARALLEL} parallel`)

    // Process a single batch
    const processBatch = async (batch: typeof unscoredJobs, batchIndex: number): Promise<{ scored: number; errors: number }> => {
      const jobsForPrompt = batch.map(job => ({
        job_id: String(job.id),
        title: job.title,
        company: job.company,
        description: job.description.substring(0, 2000)
      }))

      try {
        const prompt = formatPrompt(JOB_MATCH_BATCH_PROMPT, {
          cv_data: cvSummary,
          jobs_json: JSON.stringify(jobsForPrompt, null, 2)
        })

        const response = await aiService.complete(prompt)
        const results = parseJsonArray(response) as AIScoreResult[] | null

        let batchScored = 0
        if (results) {
          for (const result of results) {
            const jobId = parseInt(result.job_id, 10)
            if (jobId) {
              jobsRepo.updateJob(jobId, {
                matchScore: result.match_score ?? result.score,
                matchData: {
                  score: result.match_score ?? result.score ?? 0,
                  strengths: result.strengths || [],
                  gaps: result.gaps || [],
                  fitSummary: result.fit_summary ?? result.fitSummary ?? '',
                  chance: result.chance,
                  advice: result.advice || []
                }
              })
              batchScored++
            }
          }
        }
        return { scored: batchScored, errors: 0 }
      } catch (err) {
        console.error(`[Score All] Batch ${batchIndex + 1} error:`, err instanceof Error ? err.message : err)
        return { scored: 0, errors: batch.length }
      }
    }

    // Run batches in parallel waves
    for (let waveStart = 0; waveStart < batches.length; waveStart += PARALLEL) {
      const wave = batches.slice(waveStart, waveStart + PARALLEL)
      const waveNum = Math.floor(waveStart / PARALLEL) + 1
      const jobsDone = Math.min((waveStart + wave.length) * BATCH_SIZE, total)

      sendScoreProgress(jobsDone, `Wave ${waveNum}: processing ${wave.length} batches in parallel...`)

      const results = await Promise.all(
        wave.map((batch, i) => processBatch(batch, waveStart + i))
      )

      for (const r of results) {
        scored += r.scored
        errors += r.errors
      }

      console.log(`[Score All] Wave ${waveNum} done: ${scored}/${total} scored`)
      sendScoreProgress(Math.min(scored + errors, total), `${scored} scored so far...`)
    }

    return { scored, errors, total, inputTokens: aiService.totalInputTokens, outputTokens: aiService.totalOutputTokens }
  })
}

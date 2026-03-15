import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type { ParsedCV, Job, CvFeedback, CoverLetter } from '../shared/types'

const api = {
  cv: {
    upload: (): Promise<ParsedCV | null> => ipcRenderer.invoke(IPC_CHANNELS.CV_UPLOAD),
    get: (): Promise<ParsedCV | null> => ipcRenderer.invoke(IPC_CHANNELS.CV_GET),
    update: (data: Partial<ParsedCV>): Promise<ParsedCV | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.CV_UPDATE, data)
  },
  ai: {
    getModels: (provider: string): Promise<{ id: string; name: string; inputPricePerMTok: number; outputPricePerMTok: number }[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_GET_MODELS, provider)
  },
  settings: {
    get: (key?: string): Promise<string | Record<string, string> | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value)
  },
  linkedin: {
    open: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.LINKEDIN_OPEN),
    checkSession: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.LINKEDIN_CHECK_SESSION),
    close: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.LINKEDIN_CLOSE)
  },
  scan: {
    start: (categories: string[], customSearches?: { keywords: string; location: string }[]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SCAN_START, categories, customSearches),
    stop: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.SCAN_STOP),
    onProgress: (callback: (data: unknown) => void): (() => void) => {
      const handler = (_: unknown, data: unknown) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_PROGRESS, handler)
    },
    onLog: (callback: (msg: string) => void): (() => void) => {
      const handler = (_: unknown, msg: string) => callback(msg)
      ipcRenderer.on(IPC_CHANNELS.SCAN_LOG, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_LOG, handler)
    },
    onBrowserStatus: (callback: (data: { status: string; message: string }) => void): (() => void) => {
      const handler = (_: unknown, data: { status: string; message: string }) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.BROWSER_STATUS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.BROWSER_STATUS, handler)
    }
  },
  jobs: {
    getAll: (filters?: unknown): Promise<Job[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_GET_ALL, filters),
    getOne: (id: number): Promise<Job | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_GET_ONE, id),
    update: (id: number, data: Partial<Job>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_UPDATE, id, data),
    scoreAll: (): Promise<{ scored: number; errors: number; total: number; inputTokens: number; outputTokens: number }> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_SCORE_ALL),
    scoreOne: (jobId: number): Promise<Job> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_SCORE_ONE, jobId),
    getUnscoredCount: (): Promise<number> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_UNSCORED_COUNT),
    deleteAll: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOBS_DELETE_ALL),
    onScoreProgress: (callback: (data: unknown) => void): (() => void) => {
      const handler = (_: unknown, data: unknown) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.JOBS_SCORE_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.JOBS_SCORE_PROGRESS, handler)
    }
  },
  cvFeedback: {
    generate: (jobTitle: string, company: string): Promise<CvFeedback> =>
      ipcRenderer.invoke(IPC_CHANNELS.CV_FEEDBACK_GENERATE, jobTitle, company),
    generateFromJob: (jobId: number): Promise<CvFeedback> =>
      ipcRenderer.invoke(IPC_CHANNELS.CV_FEEDBACK_GENERATE_FROM_JOB, jobId),
    getAll: (): Promise<CvFeedback[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.CV_FEEDBACK_GET_ALL),
    getOne: (id: number): Promise<CvFeedback | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.CV_FEEDBACK_GET_ONE, id),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.CV_FEEDBACK_DELETE, id)
  },
  data: {
    export: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.DATA_EXPORT),
    import: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DATA_IMPORT)
  },
  coverLetters: {
    getAll: (): Promise<CoverLetter[]> => ipcRenderer.invoke(IPC_CHANNELS.COVER_LETTERS_GET_ALL),
    getOne: (id: number): Promise<CoverLetter | null> => ipcRenderer.invoke(IPC_CHANNELS.COVER_LETTERS_GET_ONE, id),
    update: (id: number, content: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.COVER_LETTERS_UPDATE, id, content),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.COVER_LETTERS_DELETE, id),
    exportPdf: (id: number): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.COVER_LETTERS_EXPORT_PDF, id),
    generate: (jobId: number): Promise<CoverLetter> =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_GENERATE_COVER_LETTER, jobId)
  }
}

export type ApiType = typeof api

contextBridge.exposeInMainWorld('api', api)

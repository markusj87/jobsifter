export interface ParsedCV {
  id: number
  rawText: string
  name: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
  experience: Experience[]
  education: Education[]
  updatedAt: string
}

export interface Experience {
  title: string
  company: string
  dates: string
  description: string
}

export interface Education {
  degree: string
  institution: string
  dates: string
}

export interface Job {
  id: number
  linkedinJobId: string
  title: string
  company: string
  location: string
  postedDate: string
  easyApply: boolean
  jobUrl: string
  description: string
  category: string
  matchScore: number | null
  matchData: MatchResult | null
  scannedAt: string
  isBookmarked: boolean
  isHidden: boolean
}

export interface MatchResult {
  score: number
  strengths: string[]
  gaps: string[]
  fitSummary: string
  chance?: string
  advice?: string[]
}

export interface CoverLetter {
  id: number
  jobId: number
  content: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
}

export interface ScanProgress {
  category: string
  jobsFound: number
  currentJob: string
  status: 'scanning' | 'paused' | 'completed' | 'error'
  errorMessage?: string
}

export interface CvFeedback {
  id: number
  jobTitle: string
  company: string
  feedback: string
  createdAt: string
}

export type AIProvider = 'claude' | 'openai' | 'none'

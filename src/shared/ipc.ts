export const IPC_CHANNELS = {
  // CV
  CV_UPLOAD: 'cv:upload',
  CV_GET: 'cv:get',
  CV_UPDATE: 'cv:update',

  // LinkedIn
  LINKEDIN_OPEN: 'linkedin:open',
  LINKEDIN_CHECK_SESSION: 'linkedin:check-session',
  LINKEDIN_CLOSE: 'linkedin:close',

  // Scanning
  SCAN_START: 'scan:start',
  SCAN_STOP: 'scan:stop',
  SCAN_PROGRESS: 'scan:progress',
  SCAN_LOG: 'scan:log',
  BROWSER_STATUS: 'browser:status',

  // Jobs
  JOBS_GET_ALL: 'jobs:get-all',
  JOBS_GET_ONE: 'jobs:get-one',
  JOBS_UPDATE: 'jobs:update',
  JOBS_SCORE_ALL: 'jobs:score-all',
  JOBS_SCORE_ONE: 'jobs:score-one',
  JOBS_UNSCORED_COUNT: 'jobs:unscored-count',
  JOBS_DELETE_ALL: 'jobs:delete-all',
  JOBS_SCORE_PROGRESS: 'jobs:score-progress',

  // AI
  AI_MATCH: 'ai:match',
  AI_GENERATE_COVER_LETTER: 'ai:generate-cover-letter',

  // Cover Letters
  COVER_LETTERS_GET_ALL: 'cover-letters:get-all',
  COVER_LETTERS_GET_ONE: 'cover-letters:get-one',
  COVER_LETTERS_UPDATE: 'cover-letters:update',
  COVER_LETTERS_DELETE: 'cover-letters:delete',
  COVER_LETTERS_EXPORT_PDF: 'cover-letters:export-pdf',

  // CV Feedback
  CV_FEEDBACK_GENERATE: 'cv-feedback:generate',
  CV_FEEDBACK_GENERATE_FROM_JOB: 'cv-feedback:generate-from-job',
  CV_FEEDBACK_GET_ALL: 'cv-feedback:get-all',
  CV_FEEDBACK_GET_ONE: 'cv-feedback:get-one',
  CV_FEEDBACK_DELETE: 'cv-feedback:delete',

  // AI
  AI_GET_MODELS: 'ai:get-models',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set'
} as const

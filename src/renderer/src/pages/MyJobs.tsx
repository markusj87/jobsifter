import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../../../shared/types'
import { SparkleIcon, BriefcaseIcon, ExternalLinkIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import { scoreStyle } from '../utils/score-style'
import Dialog from '../components/Dialog'

interface ScoreProgress {
  current: number
  total: number
  jobTitle: string
  error?: string
  inputTokens?: number
  outputTokens?: number
}

// Global scoring state lives outside the component so it persists across tab
// navigation. React unmounts the component when the user switches tabs, but
// scoring continues in the main process. Keeping state at module scope lets the
// component re-hydrate from the latest progress when the user returns.
let globalScoring = false
let globalScoreProgress: ScoreProgress | null = null
let globalFeedbackJobId: number | null = null
const scoreListeners = new Set<() => void>()

function notifyScoreListeners() {
  scoreListeners.forEach((fn) => fn())
}

// Listen for score progress globally (once, not per component mount)
let progressListenerSetup = false
function setupGlobalProgressListener() {
  if (progressListenerSetup) return
  progressListenerSetup = true
  window.api.jobs.onScoreProgress((data) => {
    globalScoreProgress = data as ScoreProgress
    notifyScoreListeners()
  })
}

export default function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(globalScoring)
  const [scoreProgress, setScoreProgress] = useState<ScoreProgress | null>(globalScoreProgress)
  const [showScoreConfirm, setShowScoreConfirm] = useState(false)
  const [unscoredCount, setUnscoredCount] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [scoringJobId, setScoringJobId] = useState<number | null>(null)
  const [feedbackJobId, setFeedbackJobId] = useState<number | null>(globalFeedbackJobId)
  const [feedbackDoneJobTitles, setFeedbackDoneJobTitles] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [locationFilter, setLocationFilter] = useState('')
  const [easyApplyOnly, setEasyApplyOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'match_score' | 'scanned_at' | 'company'>('match_score')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const loadJobs = async () => {
    setLoading(true)
    try {
      const result = await window.api.jobs.getAll({
        minScore: minScore > 0 ? minScore : undefined,
        location: locationFilter || undefined,
        easyApply: easyApplyOnly || undefined,
        sortBy,
        sortOrder: 'desc'
      })
      setJobs(result as Job[])
    } finally {
      setLoading(false)
    }
  }

  const loadFeedbackStatus = async () => {
    const feedbacks = await window.api.cvFeedback.getAll() as { jobTitle: string; company: string }[]
    setFeedbackDoneJobTitles(new Set(feedbacks.map(f => `${f.jobTitle}|||${f.company}`)))
  }

  useEffect(() => { loadJobs(); loadFeedbackStatus() }, [minScore, locationFilter, easyApplyOnly, sortBy])

  useEffect(() => {
    setupGlobalProgressListener()
    const listener = () => {
      setScoring(globalScoring)
      setScoreProgress(globalScoreProgress)
      setFeedbackJobId(globalFeedbackJobId)
      if (globalScoreProgress && globalScoreProgress.current % 10 === 0) loadJobs()
    }
    scoreListeners.add(listener)
    return () => { scoreListeners.delete(listener) }
  }, [])

  const handleScoreClick = async () => {
    const count = await window.api.jobs.getUnscoredCount()
    if (count === 0) {
      showToast('All jobs are already scored.', 'info')
      return
    }
    setUnscoredCount(count)

    // Get current model pricing
    const settings = await window.api.settings.get() as Record<string, string>
    const provider = settings?.aiProvider || 'claude'
    const modelId = settings?.aiModel || ''
    const models = await window.api.ai.getModels(provider)
    const model = models.find((m) => m.id === modelId) || models[0]
    if (model) {
      const cost = (count * 800 * model.inputPricePerMTok / 1_000_000) + (count * 300 * model.outputPricePerMTok / 1_000_000)
      setEstimatedCost(cost)
    }

    setShowScoreConfirm(true)
  }

  const handleScoreAll = async () => {
    setShowScoreConfirm(false)
    globalScoring = true
    globalScoreProgress = null
    setScoring(true)
    setScoreProgress(null)
    try {
      const result = await window.api.jobs.scoreAll() as { scored: number; errors: number; total: number; inputTokens: number; outputTokens: number }
      const totalTokens = (result.inputTokens + result.outputTokens).toLocaleString()
      showToast(`Scored ${result.scored} jobs | ${totalTokens} tokens used${result.errors > 0 ? ` | ${result.errors} errors` : ''}`, result.errors > 0 ? 'info' : 'success')
    } catch (err) {
      showToast(`Scoring failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      globalScoring = false
      globalScoreProgress = null
      setScoring(false)
      setScoreProgress(null)
      loadJobs()
    }
  }

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs
    const q = searchQuery.toLowerCase()
    return jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q))
  }, [jobs, searchQuery])

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            My Jobs
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
            {searchQuery ? `${filteredJobs.length} of ${jobs.length} jobs` : `${jobs.length} jobs found`}
          </p>
        </div>
        {!scoring ? (
          <button onClick={handleScoreClick} className="pill-button pill-button-primary" style={{ gap: '6px', fontSize: '13px', padding: '8px 20px' }}>
            <SparkleIcon size={16} />
            Score All
          </button>
        ) : (
          <button disabled className="pill-button" style={{ gap: '6px', fontSize: '13px', padding: '8px 20px', background: 'var(--color-surface-active)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'not-allowed' }}>
            <SparkleIcon size={16} />
            Scoring<span className="bounce-dots"><span>.</span><span>.</span><span>.</span></span>
          </button>
        )}
      </div>

      {/* Score Confirm Dialog */}
      <Dialog
        open={showScoreConfirm}
        onClose={() => setShowScoreConfirm(false)}
        title={`Score ${unscoredCount} unscored jobs?`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Jobs to score</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{unscoredCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>API calls (batches of 10)</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{Math.ceil(unscoredCount / 10)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Estimated tokens</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>~{(unscoredCount * 1100).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Estimated cost (selected model)</span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>~${estimatedCost.toFixed(3)}</span>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-quaternary)', margin: '0 0 14px 0' }}>
          Estimates are approximate. Actual usage depends on job description lengths and model.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleScoreAll} className="pill-button pill-button-primary" style={{ fontSize: '13px', padding: '8px 20px', gap: '6px' }}>
            <SparkleIcon size={14} />
            Start Scoring
          </button>
          <button onClick={() => setShowScoreConfirm(false)} className="pill-button pill-button-secondary" style={{ fontSize: '13px', padding: '8px 20px' }}>
            Cancel
          </button>
        </div>
      </Dialog>

      {/* Scoring Progress */}
      {scoring && scoreProgress && (
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Scoring with AI: {scoreProgress.current} / {scoreProgress.total}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((scoreProgress.current / scoreProgress.total) * 100)}%
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--color-surface-active)', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{
              height: '100%', borderRadius: '2px', background: 'var(--color-accent)',
              width: `${(scoreProgress.current / scoreProgress.total) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {scoreProgress.error ? (
                <span style={{ color: 'var(--color-red-text)' }}>Error: {scoreProgress.error}</span>
              ) : (
                scoreProgress.jobTitle
              )}
            </p>
            {(scoreProgress.inputTokens || scoreProgress.outputTokens) ? (
              <span style={{ fontSize: '11px', color: 'var(--color-text-quaternary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                {((scoreProgress.inputTokens || 0) + (scoreProgress.outputTokens || 0)).toLocaleString()} tokens
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search title or company..."
          className="apple-input"
          style={{ width: '220px', padding: '7px 12px', fontSize: '13px' }}
        />

        <div style={{ width: '1px', height: '20px', background: 'var(--color-border-light)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>Min Score</label>
          <input
            type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ width: '100px', accentColor: 'var(--color-accent)' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: '28px' }}>{minScore}</span>
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--color-border-light)' }} />

        <input
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filter by location..."
          className="apple-input"
          style={{ width: '180px', padding: '7px 12px', fontSize: '13px' }}
        />

        <div style={{ width: '1px', height: '20px', background: 'var(--color-border-light)' }} />

        <button
          onClick={() => setEasyApplyOnly(!easyApplyOnly)}
          className={`apple-toggle ${easyApplyOnly ? 'active' : ''}`}
        />
        <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Easy Apply</label>

        <div style={{ width: '1px', height: '20px', background: 'var(--color-border-light)' }} />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="apple-select"
          style={{ fontSize: '13px', padding: '7px 32px 7px 12px' }}
        >
          <option value="match_score">Sort by Score</option>
          <option value="scanned_at">Sort by Date</option>
          <option value="company">Sort by Company</option>
        </select>
      </div>

      {/* Job List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-quaternary)', fontSize: '14px' }}>Loading...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-card-solid" style={{ padding: '60px', textAlign: 'center' }}>
          <BriefcaseIcon size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-quaternary)' } as React.CSSProperties} />
          <p style={{ fontSize: '15px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>No jobs found</p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-quaternary)', marginTop: '4px' }}>Run a scan to discover opportunities</p>
        </div>
      ) : (
        <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '72px 1fr 140px 120px 75px 55px 260px',
            padding: '10px 20px', borderBottom: '1px solid var(--color-border-light)',
            background: 'var(--color-surface)'
          }}>
            {['Score', 'Title', 'Company', 'Location', 'Category', 'Easy', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {/* Table rows */}
          <div>
            {filteredJobs.map((job, i) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '72px 1fr 140px 120px 75px 55px 260px',
                  padding: '12px 20px', alignItems: 'center',
                  borderBottom: i < filteredJobs.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '3px 10px', borderRadius: '980px',
                    fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    ...scoreStyle(job.matchScore)
                  }}
                >
                  {job.matchScore ?? '--'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>{job.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.location}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-quaternary)' }}>{job.category}</span>
                <span>
                  {job.easyApply && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-green-text)', background: 'var(--color-green-soft)', padding: '2px 8px', borderRadius: '980px' }}>Easy</span>
                  )}
                </span>
                <span style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={job.matchScore !== null || scoringJobId === job.id}
                    onClick={async (e) => {
                      e.stopPropagation()
                      setScoringJobId(job.id)
                      try {
                        await window.api.jobs.scoreOne(job.id)
                        loadJobs()
                        showToast(`Scored: ${job.title}`, 'success')
                      } catch (err) {
                        showToast(`Score failed: ${err instanceof Error ? err.message : 'Error'}`, 'error')
                      } finally {
                        setScoringJobId(null)
                      }
                    }}
                    style={{
                      padding: '3px 8px', borderRadius: '980px', border: 'none', cursor: job.matchScore !== null ? 'default' : 'pointer',
                      fontSize: '11px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '3px',
                      background: job.matchScore !== null ? 'var(--color-surface-hover)' : 'var(--color-accent-soft)',
                      color: job.matchScore !== null ? 'var(--color-text-quaternary)' : 'var(--color-accent)',
                      opacity: job.matchScore !== null ? 0.5 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    <SparkleIcon size={10} />
                    {scoringJobId === job.id ? <span className="bounce-dots"><span>.</span><span>.</span><span>.</span></span> : 'Score'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(job.jobUrl, '_blank')
                    }}
                    style={{
                      padding: '3px 8px', borderRadius: '980px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '3px',
                      background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-soft)'; e.currentTarget.style.color = 'var(--color-accent)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                  >
                    <ExternalLinkIcon size={10} />
                    Open
                  </button>
                  <button
                    disabled={feedbackJobId === job.id || feedbackDoneJobTitles.has(`${job.title}|||${job.company}`)}
                    onClick={async (e) => {
                      e.stopPropagation()
                      globalFeedbackJobId = job.id
                      setFeedbackJobId(job.id)
                      notifyScoreListeners()
                      try {
                        const result = await window.api.cvFeedback.generateFromJob(job.id) as { id: number }
                        showToast('Resume feedback generated!', 'success')
                        loadFeedbackStatus()
                        navigate(`/cv-feedback/${result.id}`)
                      } catch (err) {
                        showToast(`Feedback failed: ${err instanceof Error ? err.message : 'Error'}`, 'error')
                      } finally {
                        globalFeedbackJobId = null
                        setFeedbackJobId(null)
                        notifyScoreListeners()
                      }
                    }}
                    style={{
                      padding: '3px 8px', borderRadius: '980px', border: 'none',
                      cursor: (feedbackJobId === job.id || feedbackDoneJobTitles.has(`${job.title}|||${job.company}`)) ? 'default' : 'pointer',
                      fontSize: '11px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '3px',
                      whiteSpace: 'nowrap',
                      background: feedbackDoneJobTitles.has(`${job.title}|||${job.company}`) ? 'var(--color-surface-hover)' : 'var(--color-purple-soft)',
                      color: feedbackDoneJobTitles.has(`${job.title}|||${job.company}`) ? 'var(--color-text-quaternary)' : 'var(--color-purple)',
                      opacity: (feedbackJobId === job.id || feedbackDoneJobTitles.has(`${job.title}|||${job.company}`)) ? 0.5 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    <SparkleIcon size={10} />
                    {feedbackJobId === job.id
                      ? <span className="bounce-dots"><span>.</span><span>.</span><span>.</span></span>
                      : 'Resume Feedback'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

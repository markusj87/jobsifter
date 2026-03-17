import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../../../shared/types'
import { BriefcaseIcon, ScanIcon, SparkleIcon, DocumentIcon } from '../components/icons'
import { scoreStyle } from '../utils/score-style'

export default function Dashboard() {
  const navigate = useNavigate()
  const [topJobs, setTopJobs] = useState<Job[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [topMatches, setTopMatches] = useState(0)
  const [coverLetterCount, setCoverLetterCount] = useState(0)
  const [hasCV, setHasCV] = useState(false)

  useEffect(() => {
    // Top 5 for the list
    window.api.jobs.getAll({ sortBy: 'match_score', sortOrder: 'desc', limit: 5 }).then((data) => {
      setTopJobs(data as Job[])
    })
    // All jobs for counts
    window.api.jobs.getAll({}).then((data) => {
      const all = data as Job[]
      setTotalJobs(all.length)
      setTopMatches(all.filter((j) => (j.matchScore ?? 0) >= 70).length)
    })
    window.api.coverLetters.getAll().then((data) => {
      setCoverLetterCount((data as unknown[]).length)
    })
    window.api.cv.get().then((cv) => {
      setHasCV(!!cv)
    })
  }, [])

  return (
    <div className="page-enter">
      {/* Page header */}
      <div className="mb-8">
        <h2
          className="text-[28px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Dashboard
        </h2>
        <p
          className="text-[15px] mt-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Your job search at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5 mb-8 stagger-enter">
        {/* Jobs Scanned */}
        <div
          className="glass-card-solid p-6 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:scale-[1.02] cursor-default"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--color-accent-soft)' }}
            >
              <BriefcaseIcon size={18} className="text-[var(--color-accent)]" />
            </div>
            <span
              className="text-[13px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Jobs Scanned
            </span>
          </div>
          <p
            className="text-[36px] font-semibold tracking-tight leading-none"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {totalJobs}
          </p>
        </div>

        {/* Top Matches */}
        <div
          className="glass-card-solid p-6 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:scale-[1.02] cursor-default"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--color-green-soft)' }}
            >
              <SparkleIcon size={18} className="text-[var(--color-green-text)]" />
            </div>
            <span
              className="text-[13px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Top Matches (70+)
            </span>
          </div>
          <p
            className="text-[36px] font-semibold tracking-tight leading-none"
            style={{ color: 'var(--color-green-text)' }}
          >
            {topMatches}
          </p>
        </div>

        {/* Cover Letters */}
        <div
          className="glass-card-solid p-6 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:scale-[1.02] cursor-default"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--color-purple-soft)' }}
            >
              <DocumentIcon size={18} className="text-[var(--color-purple)]" />
            </div>
            <span
              className="text-[13px] font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cover Letters
            </span>
          </div>
          <p
            className="text-[36px] font-semibold tracking-tight leading-none"
            style={{ color: 'var(--color-accent)' }}
          >
            {coverLetterCount}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <button
          onClick={() => navigate('/scan')}
          className="pill-button pill-button-primary gap-2.5 py-4 px-6 text-left w-full"
          style={{ borderRadius: 'var(--radius-lg)', justifyContent: 'flex-start' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
          >
            <ScanIcon size={20} className="text-white" />
          </div>
          <div>
            <span className="block text-[15px] font-semibold text-white">Scan Now</span>
            <span className="block text-[13px] text-white/60 mt-0.5">
              Find new jobs across multiple platforms
            </span>
          </div>
        </button>

        <button
          onClick={() => navigate('/jobs')}
          className="glass-card-solid flex items-center gap-3 py-4 px-6 text-left w-full transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:scale-[1.01] cursor-pointer"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-accent-soft)' }}
          >
            <BriefcaseIcon size={20} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <span
              className="block text-[15px] font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              View Top Matches
            </span>
            <span
              className="block text-[13px] mt-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              See your best job matches
            </span>
          </div>
        </button>
      </div>

      {/* Get Started onboarding */}
      {!hasCV && (
        <div className="glass-card p-6 mb-8">
          <h3
            className="text-[17px] font-semibold mb-4 tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Get Started
          </h3>
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold"
                style={{
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)',
                }}
              >
                1
              </span>
              <div className="pt-0.5">
                <span
                  className="text-[14px]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Connect an AI provider (Claude, OpenAI, Gemini, or Mistral) in{' '}
                  <button
                    onClick={() => navigate('/settings')}
                    className="font-medium underline underline-offset-2 transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Settings
                  </button>
                </span>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold"
                style={{
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)',
                }}
              >
                2
              </span>
              <div className="pt-0.5">
                <span
                  className="text-[14px]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Upload your CV (AI parses it automatically)
                </span>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold"
                style={{
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)',
                }}
              >
                3
              </span>
              <div className="pt-0.5">
                <span
                  className="text-[14px]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Start scanning for jobs across multiple platforms
                </span>
              </div>
            </li>
          </ol>
        </div>
      )}

      {/* Recent Top Matches list */}
      {topJobs.length > 0 && (
        <div className="glass-card-solid overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border-light)' }}
          >
            <h3
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Recent Top Matches
            </h3>
            <button
              onClick={() => navigate('/jobs')}
              className="text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-accent)' }}
            >
              View All
            </button>
          </div>
          <div>
            {topJobs.slice(0, 5).map((job, index) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="px-6 py-3.5 flex items-center justify-between cursor-pointer transition-colors duration-150"
                style={{
                  borderBottom:
                    index < Math.min(topJobs.length, 5) - 1
                      ? '1px solid var(--color-border-light)'
                      : 'none',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-accent-soft)' }}
                  >
                    <BriefcaseIcon size={15} className="text-[var(--color-accent)]" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[14px] font-medium truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {job.title}
                    </p>
                    <p
                      className="text-[12px] truncate"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {job.company} &middot; {job.location}
                    </p>
                  </div>
                </div>
                <span
                  className="flex-shrink-0 ml-4 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                  style={scoreStyle(job.matchScore)}
                >
                  {job.matchScore ?? '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

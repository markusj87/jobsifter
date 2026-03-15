import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './components/ThemeProvider'
import Dialog from './components/Dialog'
import ErrorBoundary from './components/ErrorBoundary'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import ScanJobs from './pages/ScanJobs'
import MyJobs from './pages/MyJobs'
import JobDetail from './pages/JobDetail'
import Resume from './pages/Resume'
import ResumeFeedbackList from './pages/ResumeFeedbackList'
import ResumeFeedbackDetail from './pages/ResumeFeedbackDetail'
import CoverLetters from './pages/CoverLetters'
import CoverLetterEdit from './pages/CoverLetterEdit'
import Settings from './pages/Settings'

function DisclaimerDialog({ onAccept }: { onAccept: () => void }) {
  return (
    <Dialog
      open={true}
      onClose={onAccept}
      title="Welcome to JobSifter"
      description="Before you get started, please read the following."
      closeOnBackdrop={false}
    >
      <div style={{
        padding: '16px', borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)', border: '1px solid var(--color-border-light)',
        fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7,
        maxHeight: '240px', overflowY: 'auto', marginBottom: '20px'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: 'var(--color-text-primary)' }}>Terms of Use</p>
        <p style={{ margin: '0 0 10px 0' }}>
          JobSifter is a personal productivity tool that runs entirely on your computer. All your data (CV, job listings, scores, cover letters) is stored locally and never sent to any server other than the AI provider you configure (Claude or OpenAI) for analysis purposes.
        </p>
        <p style={{ margin: '0 0 10px 0' }}>
          This tool automates browsing of job listing websites on your behalf using your own authenticated browser session. By using JobSifter, you acknowledge and agree that:
        </p>
        <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '6px' }}>You are solely responsible for complying with the terms of service of any third-party platforms you access through this tool.</li>
          <li style={{ marginBottom: '6px' }}>You will use this tool for personal job search purposes only, not for data collection, commercial scraping, or any other purpose that violates platform terms.</li>
          <li style={{ marginBottom: '6px' }}>You are responsible for monitoring your own AI API usage and associated costs.</li>
          <li style={{ marginBottom: '6px' }}>The developers of JobSifter provide no guarantees and accept no liability for how this software is used.</li>
        </ul>
        <p style={{ margin: 0 }}>
          Use this tool responsibly. Respect rate limits and terms of service of the platforms you interact with.
        </p>
      </div>

      <button
        onClick={onAccept}
        className="pill-button pill-button-primary"
        style={{ fontSize: '15px', padding: '12px 32px', width: '100%' }}
      >
        I Understand and Accept
      </button>
    </Dialog>
  )
}

export default function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem('jobsifter-disclaimer-accepted') === 'true'
  })

  const handleAccept = () => {
    localStorage.setItem('jobsifter-disclaimer-accepted', 'true')
    setDisclaimerAccepted(true)
  }

  return (
    <ThemeProvider>
    <ToastProvider>
      {!disclaimerAccepted && <DisclaimerDialog onAccept={handleAccept} />}
      <HashRouter>
        <MainLayout>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<ScanJobs />} />
              <Route path="/jobs" element={<MyJobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/cv-feedback" element={<ResumeFeedbackList />} />
              <Route path="/cv-feedback/:id" element={<ResumeFeedbackDetail />} />
              <Route path="/cover-letters" element={<CoverLetters />} />
              <Route path="/cover-letters/:id" element={<CoverLetterEdit />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </ErrorBoundary>
        </MainLayout>
      </HashRouter>
    </ToastProvider>
    </ThemeProvider>
  )
}

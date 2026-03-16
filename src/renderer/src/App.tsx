import { useState, useRef, useCallback } from 'react'
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

const TERMS_VERSION = 'v2'
const TERMS_KEY = `jobsifter-terms-accepted-${TERMS_VERSION}`

const h3Style = { margin: '18px 0 6px 0', fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' } as const
const pStyle = { margin: '0 0 10px 0' } as const
const ulStyle = { margin: '0 0 10px 0', paddingLeft: '20px' } as const
const liStyle = { marginBottom: '6px' } as const

function DisclaimerDialog({ onAccept }: { onAccept: () => void }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20
    if (atBottom) setHasScrolledToBottom(true)
  }, [])

  return (
    <Dialog
      open={true}
      onClose={() => {}}
      title="Welcome to JobSifter"
      description="Please read the full Terms of Use before continuing."
      closeOnBackdrop={false}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          padding: '16px', borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)', border: '1px solid var(--color-border-light)',
          fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: 1.7,
          maxHeight: '340px', overflowY: 'auto', marginBottom: '16px'
        }}
      >
        <p style={{ ...pStyle, fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>Terms of Use</p>

        <p style={h3Style}>1. Acceptance of Terms</p>
        <p style={pStyle}>
          By downloading, installing, or using JobSifter (&quot;the Software&quot;), you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you must not use the Software.
        </p>

        <p style={h3Style}>2. Nature of the Software</p>
        <p style={pStyle}>
          JobSifter is a free, open-source desktop application licensed under the GNU General Public License v3.0 (GPL-3.0). The Software assists users in their job search by scanning job boards, scoring listings using artificial intelligence, and generating cover letters. It is a productivity tool — not a guarantee of employment or interview outcomes.
        </p>

        <p style={h3Style}>3. Disclaimer of Warranties</p>
        <p style={pStyle}>
          The Software is provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. The developers make no warranty that:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>The Software will meet your specific requirements</li>
          <li style={liStyle}>The Software will be uninterrupted, timely, secure, or error-free</li>
          <li style={liStyle}>The results obtained (including AI-generated match scores, cover letters, and resume feedback) will be accurate, complete, or reliable</li>
          <li style={liStyle}>Any job board scraping functionality will continue to work as third-party websites may change their structure at any time</li>
        </ul>

        <p style={h3Style}>4. AI Services &amp; API Cost Responsibility</p>
        <p style={pStyle}>
          JobSifter integrates with third-party AI services, including but not limited to OpenAI and Anthropic (Claude). To use these AI features, you must provide your own API keys and maintain your own accounts with these providers.
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>The token usage and cost estimates displayed within JobSifter are <strong>approximations only</strong>. They may not reflect current pricing, actual billed amounts, or exact token counts.</li>
          <li style={liStyle}>You are <strong>solely responsible</strong> for monitoring your API usage, token consumption, and associated costs on your OpenAI, Anthropic, or any other AI provider account.</li>
          <li style={liStyle}>The developers of JobSifter are <strong>not liable</strong> for any charges, overages, or unexpected costs incurred through your use of third-party API services.</li>
          <li style={liStyle}>We strongly recommend setting spending limits and usage alerts directly on your AI provider accounts.</li>
        </ul>

        <p style={h3Style}>5. Limitation of Liability</p>
        <p style={pStyle}>
          In no event shall the developers, contributors, or copyright holders of JobSifter be liable for any direct, indirect, incidental, special, consequential, or exemplary damages (including, but not limited to, loss of data, loss of profits, procurement of substitute goods or services, or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this Software, even if advised of the possibility of such damage.
        </p>

        <p style={h3Style}>6. User Responsibility</p>
        <p style={pStyle}>You are solely responsible for:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>How you use the Software and any actions you take based on its output</li>
          <li style={liStyle}>Verifying the accuracy and appropriateness of AI-generated content before using it in job applications</li>
          <li style={liStyle}>Complying with the terms of service of any job boards you access through the Software</li>
          <li style={liStyle}>Using this tool for personal job search purposes only, not for data collection, commercial scraping, or any purpose that violates platform terms</li>
          <li style={liStyle}>Safeguarding your API keys and not sharing them with unauthorized parties</li>
          <li style={liStyle}>Ensuring your use of the Software complies with applicable local, national, and international laws and regulations</li>
        </ul>

        <p style={h3Style}>7. Data &amp; Privacy</p>
        <p style={pStyle}>
          JobSifter runs entirely on your local machine. We do not collect, transmit, or store any of your personal data, resumes, job search activity, or API keys. All data remains on your device.
        </p>
        <p style={pStyle}>
          However, when you use AI features, your data (such as resume text and job descriptions) is sent to the third-party AI provider you have configured (e.g., OpenAI or Anthropic) according to their respective privacy policies and terms of service. You should review these policies independently.
        </p>

        <p style={h3Style}>8. AI-Generated Content</p>
        <p style={pStyle}>
          Content generated by AI features (including cover letters, match scores, and resume feedback) is machine-generated and may contain inaccuracies, biases, or errors. This content should be treated as a starting point and reviewed, edited, and validated by you before use. The developers are not responsible for the quality, accuracy, or consequences of using AI-generated content.
        </p>

        <p style={h3Style}>9. Open Source License</p>
        <p style={pStyle}>JobSifter is released under the GNU General Public License v3.0. This means:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>You are free to use, modify, and distribute the Software</li>
          <li style={liStyle}>Any modified versions must also be released under GPL-3.0</li>
          <li style={liStyle}>The Software comes with no warranty, as stated in the GPL-3.0 license</li>
        </ul>

        <p style={h3Style}>10. Third-Party Services</p>
        <p style={pStyle}>
          JobSifter interacts with third-party services including job boards (LinkedIn, Indeed, Platsbanken, RemoteOK) and AI providers (OpenAI, Anthropic). These services have their own terms of use and privacy policies. The developers of JobSifter have no control over, and assume no responsibility for, the content, policies, or practices of any third-party services.
        </p>

        <p style={h3Style}>11. Changes to These Terms</p>
        <p style={{ margin: 0 }}>
          We reserve the right to modify these Terms of Use at any time. Changes will be presented to you upon next launch. Continued use of the Software after changes constitutes acceptance of the revised terms.
        </p>
      </div>

      {!hasScrolledToBottom && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center', margin: '0 0 12px 0' }}>
          ↓ Scroll to the bottom to enable the accept button
        </p>
      )}

      <button
        onClick={onAccept}
        disabled={!hasScrolledToBottom}
        className="pill-button pill-button-primary"
        style={{
          fontSize: '15px', padding: '12px 32px', width: '100%',
          opacity: hasScrolledToBottom ? 1 : 0.4,
          cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed'
        }}
      >
        I Understand and Accept
      </button>
    </Dialog>
  )
}

export default function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem(TERMS_KEY) === 'true'
  })

  const handleAccept = () => {
    localStorage.setItem(TERMS_KEY, 'true')
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

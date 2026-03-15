<p align="center">
  <h1 align="center">JobSifter</h1>
  <p align="center">
    <strong>Free &amp; open source (GPL-3.0)</strong> desktop app that uses AI to help you find your next job.<br>
    Stop wasting time on jobs you won't get. Focus on the ones that actually match you.
  </p>
  <p align="center">
    <a href="#features">Features</a> &middot;
    <a href="#getting-started">Getting Started</a> &middot;
    <a href="#architecture">Architecture</a> &middot;
    <a href="#contributing">Contributing</a> &middot;
    <a href="#license">License</a>
  </p>
</p>

---

## Why JobSifter?

Job searching sucks. You open listing after listing, read through walls of text, and most of them aren't even a good fit for you. You end up spending hours just browsing instead of actually applying to the right roles.

JobSifter was built to fix that. It does the tedious part for you:

- **Scans job listings automatically** - no more manually clicking through pages of results. JobSifter opens each listing, reads the full description, and saves it locally
- **Tells you which jobs actually match you** - AI analyzes every job against your CV and gives you a match score, so you can skip the 30% matches and focus on the 85% ones
- **Generates cover letters from your real experience** - when you find a great match, AI writes a personalized cover letter based on your actual CV and the specific job description. No generic templates

The app is **100% free**, **open source** under the GPL-3.0 license, and runs entirely on your own computer. The only cost is the AI API usage from the provider you choose (Claude or OpenAI) using your own account - and the app shows you estimated costs before every scoring run so there are no surprises. Scoring 100 jobs typically costs between $0.04 and $0.69 depending on model. Your CV and data never leave your machine (except to the AI provider for analysis). No accounts with us, no subscriptions, no data collection.

## Download

Download the latest version for your platform:

| Platform | Download |
|----------|----------|
| Windows | [JobSifter-Setup-1.0.0.exe](https://github.com/markusj87/linkedinjobfinder/releases/latest/download/JobSifter-Setup-1.0.0.exe) |
| macOS (Intel) | [JobSifter-1.0.0-x64.dmg](https://github.com/markusj87/linkedinjobfinder/releases/latest/download/JobSifter-1.0.0-x64.dmg) |
| macOS (Apple Silicon) | [JobSifter-1.0.0-arm64.dmg](https://github.com/markusj87/linkedinjobfinder/releases/latest/download/JobSifter-1.0.0-arm64.dmg) |

> After downloading, you'll also need an API key from [Anthropic (Claude)](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/) for the AI features.

> **Note:** The macOS build needs to be built on a Mac. If you're on macOS, clone the repo and run `npm run dist:mac` to build it yourself.

## Features

### Core Workflow
- **AI-Powered CV Parsing** - Upload a PDF resume and AI extracts your name, contact info, skills, experience, education, and generates a detailed candidate profile
- **Automated Job Scanning** - Browses job listing pages with a real browser, scrolls through all results, handles pagination, and extracts full job descriptions
- **Custom Search** - Search by keywords and location (e.g. "Product Manager" + "Stockholm") on top of predefined categories
- **AI Job Matching** - Analyzes each job against your CV with a 0-100 score, strengths, gaps, fit summary, and interview advice
- **Resume Feedback** - Get AI-powered feedback on your CV tailored to a specific role and company. From My Jobs you can get feedback based on the full job description, or from the Resume page by entering any role/company manually. All feedback is saved so you can revisit it anytime
- **Cover Letter Generation** - Creates personalized, natural-sounding cover letters that reference your actual experience
- **PDF Export** - Export cover letters as professionally formatted PDFs

### Technical Highlights
- **Batch AI Scoring** - Scores 10 jobs per API call, 5 calls in parallel = 50 jobs simultaneously
- **Token Tracking** - Real-time token consumption and cost estimates during scoring
- **Incremental Scanning** - Skips already-scanned jobs, resumes where you left off
- **Session Persistence** - Browser login session saved to disk, no re-authentication needed
- **Offline Browsing** - All scanned jobs stored locally in SQLite, browse and filter without internet
- **36 Job Categories** - Predefined categories covering all industries plus custom keyword search
- **Privacy First** - Zero telemetry, no servers, data only leaves your machine to your chosen AI provider

## Screenshots

[View all screenshots](SCREENSHOTS.md)

![Dashboard](docs/Dashboard.png)

## Getting Started

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| API Key | [Anthropic (Claude)](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/) |

### Installation

```bash
# Clone the repository
git clone https://github.com/markusj87/linkedinjobfinder.git
cd jobsifter

# Install dependencies (automatically rebuilds native modules for Electron)
npm install

# Install Chromium for browser automation
npx playwright install chromium
```

### Development

```bash
# Start in development mode with hot reload
npm run dev
```

### Build Installers

```bash
# Windows (.exe installer)
npm run dist:win

# macOS (.dmg)
npm run dist:mac

# All platforms
npm run dist
```

## How It Works

### Step-by-step

1. **Connect AI** - Go to Settings, select Claude or OpenAI, enter your API key, choose a model
2. **Upload CV** - Go to Resume, upload your PDF. AI parses it into structured data with a detailed candidate profile
3. **Scan Jobs** - Go to Scan Jobs, connect your browser session, select categories or add custom searches, hit Start Scan
4. **Review Matches** - Go to My Jobs, click Score All. AI scores every job in parallel batches. Sort and filter by score
5. **Deep Dive** - Click any job to see full description, match analysis, strengths, gaps, and personalized interview advice
6. **Resume Feedback** - Get AI feedback on how to improve your CV for a specific job. Available from My Jobs (uses full job description) or from the Resume page (manual entry)
7. **Apply** - Generate a cover letter, edit it, export as PDF

### Scanning Flow

```
User clicks Start Scan
  |
  v
Playwright opens browser (visible, with saved session)
  |
  v
For each category / custom search:
  |
  ├── Navigate to job listing page
  ├── Scroll to load all jobs (smart scroll with job counting)
  ├── Collect all job IDs from page
  ├── For each job:
  |     ├── Skip if already in database
  |     ├── Click job card to load detail panel
  |     ├── Extract title, company, location, description, easy-apply status
  |     ├── Save to SQLite
  |     └── Wait (human-like random delay)
  ├── Click next page button
  └── Repeat until no more pages
```

### AI Scoring Flow

```
User clicks Score All
  |
  v
Unscored jobs split into batches of 10
  |
  v
5 batches sent to AI in parallel (50 jobs at once)
  |
  v
Each batch returns: score, strengths, gaps, summary, chance, advice
  |
  v
Results saved to SQLite, UI updates progressively
```

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Framework | Electron |
| Build Tool | electron-vite |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Browser Automation | Playwright |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude SDK / OpenAI SDK |
| PDF Generation | Playwright page.pdf() |
| Installer | electron-builder |

### Project Structure

```
src/
  main/                          # Electron main process (Node.js)
    index.ts                     # App lifecycle, window management
    ipc-handlers.ts              # All IPC request handlers (CV, jobs, AI, settings)
    ai/
      ai-service.ts              # AI provider abstraction (Claude/OpenAI), token tracking
      prompts.ts                 # All AI prompt templates (CV parsing, matching, cover letters)
    browser/
      playwright-manager.ts      # Browser lifecycle, persistent context, stealth config
      linkedin-auth.ts           # Session detection via cookies
      scanner.ts                 # Job scanning orchestration, pagination, error recovery
      scroll-utils.ts            # Smart scrolling with job count detection
      selectors.ts               # Centralized DOM selectors (easy to update)
    database/
      database.ts                # SQLite connection, WAL mode, migrations
      migrations.ts              # Schema definitions (jobs, cv, cover_letters, settings)
      repositories/              # Data access layer
        jobs.ts                  # Job CRUD, filtering, sorting, pagination
        cv.ts                    # CV upsert/get
        cover-letters.ts         # Cover letter CRUD
        settings.ts              # Key-value settings store
        cv-feedback.ts           # Resume feedback CRUD
    pdf/
      pdf-generator.ts           # HTML-to-PDF via headless Playwright
      templates/
        cover-letter.html        # Cover letter PDF template
  preload/
    index.ts                     # Typed contextBridge API (renderer <-> main)
  renderer/                      # React frontend
    src/
      App.tsx                    # Root component, routing, first-launch disclaimer
      components/
        Toast.tsx                # Global notification system
        icons.tsx                # SVG icon components
        layout/
          Sidebar.tsx            # Navigation sidebar
          MainLayout.tsx         # Page layout with drag region
        cv/
          CVUploader.tsx         # PDF upload + text paste
          CVPreview.tsx          # Editable CV data display
      pages/
        Dashboard.tsx            # Stats, quick actions, top matches
        ScanJobs.tsx             # Scan controls, custom search, category selection, logs
        MyJobs.tsx               # Job table, filters, batch scoring with progress
        JobDetail.tsx            # Full job view, match analysis, cover letter generation
        Resume.tsx               # CV display (2-column layout), upload, edit
        ResumeFeedbackList.tsx   # Saved resume feedback list
        ResumeFeedbackDetail.tsx # Full AI feedback view with markdown rendering
        CoverLetters.tsx         # Cover letter list
        CoverLetterEdit.tsx      # Cover letter editor + PDF export
        Settings.tsx             # AI provider, model selection, pricing, disclaimer
      styles/
        index.css                # Tailwind + Apple-inspired design system
  shared/                        # Shared between main + renderer
    types.ts                     # TypeScript interfaces
    ipc.ts                       # IPC channel constants
    constants.ts                 # App config, job categories, scan defaults
```

### IPC Communication

The app uses Electron's contextBridge pattern for secure communication between the renderer (React) and main process (Node.js):

```
Renderer (React)  -->  window.api.jobs.scoreAll()
                            |
                       Preload (contextBridge)
                            |
                       ipcRenderer.invoke('jobs:score-all')
                            |
                       Main Process (ipcMain.handle)
                            |
                       AI Service + SQLite
                            |
                       Returns result to renderer
```

Progress events (scanning, scoring) use `webContents.send()` for real-time push updates.

### Database Schema

```sql
-- All scanned jobs with match data
jobs (id, linkedin_job_id, title, company, location, posted_date,
      easy_apply, job_url, description, category, match_score,
      match_data, scanned_at, is_bookmarked, is_hidden)

-- Parsed CV data (single row)
cv (id, raw_text, name, email, phone, location, summary,
    skills, experience, education, updated_at)

-- Generated cover letters linked to jobs
cover_letters (id, job_id, content, is_edited, created_at, updated_at)

-- AI resume feedback saved for each role/company
cv_feedback (id, job_title, company, feedback, created_at)

-- Key-value settings (API keys, model selection, preferences)
settings (key, value)
```

## Supported AI Models

### Anthropic Claude

| Model | Input $/MTok | Output $/MTok | Best For |
|-------|-------------|--------------|----------|
| Claude Sonnet 4.6 | $3.00 | $15.00 | Recommended - good balance |
| Claude Opus 4.6 | $5.00 | $25.00 | Most capable |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Previous gen |
| Claude Opus 4.5 | $5.00 | $25.00 | Previous gen |
| Claude Sonnet 4 | $3.00 | $15.00 | Budget option |
| Claude Haiku 4.5 | $1.00 | $5.00 | Fastest, cheapest |

### OpenAI

| Model | Input $/MTok | Output $/MTok | Best For |
|-------|-------------|--------------|----------|
| GPT-5.4 | $2.50 | $15.00 | Latest flagship |
| GPT-5 Mini | $0.125 | $1.00 | Very fast, very cheap |
| GPT-5.3 | $1.75 | $14.00 | Previous flagship |
| o3 | $2.00 | $8.00 | Reasoning tasks |
| o3 Mini | $0.55 | $2.20 | Reasoning, budget |
| o4 Mini | $1.10 | $4.40 | Reasoning |
| GPT-4.1 | $3.00 | $12.00 | Stable |
| GPT-4.1 Mini | $0.80 | $3.20 | Budget |
| GPT-4.1 Nano | $0.20 | $0.80 | Cheapest |

*Pricing as of March 2026. The app shows cost estimates in Settings and before scoring.*

## Cost Estimates

Scoring 100 jobs typically uses ~110,000 tokens. Approximate costs:

| Model | Cost per 100 jobs |
|-------|-------------------|
| GPT-4.1 Nano | ~$0.04 |
| GPT-5 Mini | ~$0.04 |
| Claude Haiku 4.5 | ~$0.23 |
| Claude Sonnet 4.6 | ~$0.69 |
| GPT-5.4 | ~$0.65 |

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

### Development Notes

- **DOM Selectors** - Job listing selectors are centralized in `src/main/browser/selectors.ts`. If scanning breaks due to website changes, this is the first place to update.
- **AI Prompts** - All prompt templates are in `src/main/ai/prompts.ts`. Easy to tune and improve.
- **Adding Models** - Model definitions with pricing are in `src/main/ai/ai-service.ts`.

## Disclaimer

JobSifter is a personal productivity tool. All data is stored locally on your machine. You are solely responsible for complying with the terms of service of any third-party platforms you use with this tool. The developers accept no liability for how this software is used. Use responsibly and respect platform rate limits.

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software. Any derivative work must also be distributed under GPL-3.0 as open source.

---

<p align="center">
  Built with Electron, React, and AI.<br>
  <a href="https://github.com/markusj87/linkedinjobfinder/issues">Report Bug</a> &middot;
  <a href="https://github.com/markusj87/linkedinjobfinder/issues">Request Feature</a>
</p>

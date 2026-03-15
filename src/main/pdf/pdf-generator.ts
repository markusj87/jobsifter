/**
 * PDF generation for cover letters using Playwright's headless Chromium.
 */

import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ParsedCV } from '../../shared/types'

/** Generate a formatted PDF cover letter from content text and CV contact info. */
export async function generateCoverLetterPDF(
  content: string,
  cv: ParsedCV,
  outputPath: string
): Promise<void> {
  const templatePath = join(__dirname, '../../src/main/pdf/templates/cover-letter.html')
  let template: string

  try {
    template = readFileSync(templatePath, 'utf-8')
  } catch {
    // Fallback inline template if file not found (production build)
    template = getInlineTemplate()
  }

  const html = template
    .replace('{{name}}', escapeHtml(cv.name))
    .replace('{{email}}', escapeHtml(cv.email))
    .replace('{{phone}}', escapeHtml(cv.phone))
    .replace('{{location}}', escapeHtml(cv.location))
    .replace('{{date}}', new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }))
    .replace('{{content}}', escapeHtml(content).replace(/\n/g, '<br>'))

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '2.5cm', right: '2.5cm' },
      printBackground: true
    })
  } finally {
    await browser.close()
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getInlineTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #333; line-height: 1.6; }
  .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 0; }
  .contact { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .date { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
  .content { font-size: 14px; line-height: 1.8; }
</style>
</head>
<body>
  <div class="header">
    <p class="name">{{name}}</p>
    <p class="contact">{{email}} | {{phone}} | {{location}}</p>
  </div>
  <p class="date">{{date}}</p>
  <div class="content">{{content}}</div>
</body>
</html>`
}

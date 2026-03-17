export const CV_PARSE_PROMPT = `You are a CV/resume parser. Extract all structured information from the following raw CV text.

Raw CV text:
{raw_text}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, Country",
  "summary": "A detailed 8-12 sentence candidate profile. See rules below for what to include.",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Start - End",
      "description": "Brief description of role and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/School Name",
      "dates": "Start - End"
    }
  ]
}

Rules:
- The "summary" field is the MOST IMPORTANT field. Write a thorough candidate profile in third person (8-12 sentences, around 150-250 words) covering ALL of the following:
  1. Who they are: seniority level, total years of experience, current/most recent role
  2. Core expertise: primary technical domain, specializations, key technologies they excel in
  3. Career trajectory: how their career has progressed, notable companies or achievements
  4. Technical depth: specific tools, languages, frameworks, methodologies they are strong in
  5. Soft skills and leadership: team management, communication, cross-functional collaboration
  6. Industries and domains: which sectors they have worked in (fintech, e-commerce, healthcare, etc.)
  7. What makes them unique: standout achievements, certifications, unusual combinations of skills
  8. Best-fit roles: what types of positions and companies would be ideal matches
  This summary will be used to match against job descriptions so be thorough and specific. Do NOT be generic - reference actual details from the CV.
- Extract ALL skills mentioned anywhere in the CV, including tools, languages, frameworks, soft skills
- For experience, include ALL positions, most recent first
- If a field is not found, use an empty string or empty array
- Keep descriptions concise but include key achievements and numbers
- Parse dates as they appear in the original text
- Write the "summary" field in {language}. All other fields (name, skills, titles, etc.) should remain in their original language.`

export const JOB_MATCH_BATCH_PROMPT = `You are a recruitment analyst. Given this candidate's CV and multiple job descriptions, analyze the fit for EACH job.

CV Summary:
{cv_data}

Jobs to analyze:
{jobs_json}

For EACH job, respond with a JSON object. Return a JSON array with one result per job, in the same order as the input:
[
  {
    "job_id": "<the job id from input>",
    "match_score": <0-100>,
    "strengths": ["strength 1", "strength 2"],
    "gaps": ["gap 1", "gap 2"],
    "fit_summary": "<2 sentences explaining the fit>",
    "chance": "<High/Medium-High/Medium/Medium-Low/Low>",
    "advice": ["Concrete interview tip or talking point 1", "Concrete interview tip or talking point 2", "Concrete interview tip or talking point 3"]
  }
]

The "advice" field should contain 3-5 specific, actionable interview tips for this candidate applying to this job. Each tip should:
- Reference specific experience or skills from the CV that the candidate should highlight
- Address specific gaps and how to frame them positively
- Mention things to research about the company or role
- Suggest concrete talking points, stories, or questions to prepare
Be specific to the actual CV and job, not generic advice.

Write all text values (fit_summary, strengths, gaps, advice) in {language}.

Respond ONLY with the JSON array, no other text.`

export const COVER_LETTER_PROMPT = `Write a cover letter for this job application. The letter should:

1. Sound natural and personal, NOT like AI wrote it
2. Be specific to both the candidate's experience and the job requirements
3. Lead with the strongest matching experience
4. Include concrete numbers and achievements from the CV that are relevant
5. Be concise (4-6 paragraphs)
6. Start with an appropriate informal greeting (e.g. "Hi," in English, "Hej," in Swedish, etc.)
7. End with "Best regards," and the candidate's name
8. Never use em-dashes, "however", "moreover", "furthermore", "leverage", "robust", "seamless", or other overused AI words
9. Use "but" instead of "however", "also" instead of "moreover", "so" instead of "therefore"
10. State things directly rather than using "it's not X, but Y" constructions
11. Write the ENTIRE cover letter in {language}. Every word must be in {language}.
12. Use a {tone} tone throughout the letter.

Candidate CV:
{cv_data}

Job Description:
{job_description}

Company: {company}
Job Title: {job_title}`

export const CV_FEEDBACK_PROMPT = `You are an expert career coach and CV reviewer. A candidate wants to apply for a specific role at a specific company. Review their CV and provide detailed, actionable feedback to improve their chances.

Candidate CV:
{cv_data}

Target Role: {job_title}
Target Company: {company}

Provide feedback in the following sections (use markdown formatting):

## Overall Assessment
A brief 2-3 sentence assessment of how well this CV positions the candidate for this specific role at this company.

## Strengths
What parts of the CV are already strong for this application? Be specific - reference actual experience and skills.

## What to Improve
Specific changes the candidate should make to their CV before applying. For each suggestion:
- What to change
- Why it matters for this role
- How to rewrite or reframe it

## Missing Keywords & Skills
Industry-specific keywords, skills, or certifications that this role/company likely expects but are missing from the CV. Suggest how to naturally incorporate them.

## Tailoring Tips
How to tailor the CV specifically for {company}. Consider:
- Company culture and values (based on what's publicly known)
- Industry-specific language
- Which experiences to emphasize or de-emphasize
- How to reorder or restructure sections for maximum impact

## Interview Preparation
3-5 things the candidate should prepare to discuss based on gaps or areas where the CV might raise questions.

Be direct and specific. Reference actual content from the CV. Do not give generic advice. Do NOT offer to do additional work like rewriting the CV, drafting cover letters, or any follow-up tasks. Only provide the feedback sections above.

IMPORTANT: Write ALL feedback in {language}.`

export const CV_FEEDBACK_JOB_PROMPT = `You are an expert career coach and CV reviewer. A candidate wants to apply for a specific role. You have their CV AND the full job description. Review the CV and provide detailed, actionable feedback to maximize their chances for this exact position.

Candidate CV:
{cv_data}

Target Role: {job_title}
Target Company: {company}

Full Job Description:
{job_description}

Provide feedback in the following sections (use markdown formatting):

## Overall Assessment
A brief 2-3 sentence assessment of how well this CV positions the candidate for this specific role. Reference specific requirements from the job description.

## Strengths
What parts of the CV directly match the job requirements? Be specific - map CV experience to job description requirements.

## What to Improve
Specific changes to make before applying. For each suggestion:
- What to change and why it matters for THIS specific job
- How to rewrite or reframe it to match the job description language

## Missing Keywords & Skills
Skills, tools, certifications, or experience explicitly mentioned in the job description that are missing from the CV. For each, suggest how to address it (add it, reframe existing experience, or acknowledge the gap in a cover letter).

## Tailoring Tips
How to restructure or reword the CV specifically for this application:
- Which experiences to move up or expand
- Which to condense or remove
- Specific phrases from the job description to mirror in the CV
- How to align the professional summary with this role

## Interview Preparation
5 specific things the candidate should prepare to discuss based on the gaps between their CV and this job description. Include potential interview questions they might face.

Be direct and specific. Reference actual content from both the CV and job description. Do not give generic advice. Do NOT offer to do additional work like rewriting the CV, drafting cover letters, or any follow-up tasks. Only provide the feedback sections above.

IMPORTANT: Write ALL feedback in {language}.`

/** Replace `{key}` placeholders in a prompt template with provided values. */
export function formatPrompt(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}

/** Format a ParsedCV into a concise text summary suitable for inclusion in AI prompts. */
export function formatCVForPrompt(cv: { name: string; summary?: string; skills: string[]; experience: Array<{ title: string; company: string; dates: string; description?: string }>; education: Array<{ degree: string; institution: string; dates: string }> }): string {
  const parts: string[] = []
  parts.push(`Name: ${cv.name}`)
  if (cv.summary) parts.push(`Summary: ${cv.summary}`)
  if (cv.skills.length) parts.push(`Skills: ${cv.skills.join(', ')}`)
  if (cv.experience.length) {
    parts.push('Experience:')
    for (const exp of cv.experience) {
      parts.push(`- ${exp.title} at ${exp.company} (${exp.dates})`)
      if (exp.description) parts.push(`  ${exp.description}`)
    }
  }
  if (cv.education.length) {
    parts.push('Education:')
    for (const edu of cv.education) {
      parts.push(`- ${edu.degree} at ${edu.institution} (${edu.dates})`)
    }
  }
  return parts.join('\n')
}

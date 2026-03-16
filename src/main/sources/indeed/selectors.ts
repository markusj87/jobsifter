/**
 * Indeed DOM selectors for job search results extraction.
 */

export const SELECTORS = {
  /** Job card container in search results. */
  JOB_CARD: '.job_seen_beacon, .resultContent, .slider_item, [data-jk]',

  /** Job title link within a card. */
  TITLE: 'h2.jobTitle a, .jobTitle a, a.jcs-JobTitle',

  /** Company name within a card. */
  COMPANY: '[data-testid="company-name"], .companyName, .company_location .companyName',

  /** Location within a card. */
  LOCATION: '[data-testid="text-location"], .companyLocation, .company_location .companyLocation',

  /** Full job description panel. */
  DESCRIPTION: '#jobDescriptionText, .jobsearch-jobDescriptionText, .jobsearch-JobComponent-description'
} as const

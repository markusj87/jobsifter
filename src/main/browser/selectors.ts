// LinkedIn DOM selectors - centralized for easy updates when LinkedIn changes their markup
// Using multiple fallback selectors where possible for resilience

export const SELECTORS = {
  // Job list container (the scrollable sidebar with job cards)
  JOB_LIST_CONTAINER: '.scaffold-layout__list',

  // Individual job cards - try multiple selectors
  JOB_CARD: [
    '.job-card-container',
    '.jobs-search-results__list-item',
    'li.ember-view.occludable-update',
    '[data-occludable-job-id]'
  ],

  // Job card details
  JOB_CARD_TITLE: [
    '.job-card-list__title--link',
    '.job-card-container__link',
    'a[data-control-name="job_card"]',
    '.artdeco-entity-lockup__title a'
  ],
  JOB_CARD_COMPANY: [
    '.artdeco-entity-lockup__subtitle',
    '.job-card-container__primary-description',
    '.job-card-container__company-name'
  ],
  JOB_CARD_LOCATION: [
    '.artdeco-entity-lockup__caption',
    '.job-card-container__metadata-item',
    '.job-card-container__metadata-wrapper'
  ],

  // Job detail panel (right side)
  JOB_DESCRIPTION: [
    '.jobs-description__content',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '#job-details'
  ],
  EASY_APPLY_BUTTON: [
    '.jobs-apply-button--top-card',
    '.jobs-apply-button',
    'button.jobs-apply-button'
  ],

  // Pagination - the numbered page buttons at the bottom
  PAGINATION_CONTAINER: [
    '.artdeco-pagination',
    '.jobs-search-pagination',
    'ul.artdeco-pagination__pages'
  ],
  PAGINATION_BUTTON: [
    'button[aria-label*="Page"]',
    '.artdeco-pagination__indicator--number button',
    'li[data-test-pagination-page-btn] button'
  ],
  PAGINATION_ACTIVE: [
    'button[aria-current="true"]',
    '.artdeco-pagination__indicator--number.active button',
    'li.active button'
  ],

  // No results
  NO_RESULTS: '.jobs-search-no-results-banner'
} as const

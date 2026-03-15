export const LINKEDIN_BASE_URL = 'https://www.linkedin.com'

export const LINKEDIN_CATEGORIES = [
  { id: 'recommended', name: 'Recommended', url: '/jobs/collections/recommended/' },
  { id: 'easy-apply', name: 'Easy Apply', url: '/jobs/collections/easy-apply/' },
  { id: 'remote-jobs', name: 'Remote', url: '/jobs/collections/remote-jobs/' },
  { id: 'hybrid', name: 'Hybrid', url: '/jobs/collections/hybrid/' },
  { id: 'part-time-jobs', name: 'Part Time', url: '/jobs/collections/part-time-jobs/' },
  { id: 'small-business', name: 'Small Business', url: '/jobs/collections/small-business/' },
  { id: 'career-growth', name: 'Career Growth', url: '/jobs/collections/career-growth/' },
  { id: 'work-life-balance', name: 'Work-Life Balance', url: '/jobs/collections/work-life-balance/' },
  { id: 'sustainability', name: 'Sustainability', url: '/jobs/collections/sustainability/' },
  { id: 'social-impact', name: 'Social Impact', url: '/jobs/collections/social-impact/' },
  { id: 'financial-services', name: 'Financial Services', url: '/jobs/collections/financial-services/' },
  { id: 'hospitality', name: 'Hospitality', url: '/jobs/collections/hospitality/' },
  { id: 'retail', name: 'Retail', url: '/jobs/collections/retail/' },
  { id: 'manufacturing', name: 'Manufacturing', url: '/jobs/collections/manufacturing/' },
  { id: 'human-resources', name: 'Human Resources', url: '/jobs/collections/human-resources/' },
  { id: 'marketing-and-advertising', name: 'Marketing & Advertising', url: '/jobs/collections/marketing-and-advertising/' },
  { id: 'education', name: 'Education', url: '/jobs/collections/education/' },
  { id: 'hospitals-and-healthcare', name: 'Healthcare', url: '/jobs/collections/hospitals-and-healthcare/' },
  { id: 'construction', name: 'Construction', url: '/jobs/collections/construction/' },
  { id: 'transportation-and-logistics', name: 'Transport & Logistics', url: '/jobs/collections/transportation-and-logistics/' },
  { id: 'real-estate', name: 'Real Estate', url: '/jobs/collections/real-estate/' },
  { id: 'media', name: 'Media', url: '/jobs/collections/media/' },
  { id: 'biotechnology', name: 'Biotech', url: '/jobs/collections/biotechnology/' },
  { id: 'pharmaceuticals', name: 'Pharmaceuticals', url: '/jobs/collections/pharmaceuticals/' },
  { id: 'defense-and-space', name: 'Defense & Space', url: '/jobs/collections/defense-and-space/' },
  { id: 'government', name: 'Government', url: '/jobs/collections/government/' },
  { id: 'staffing-and-recruiting', name: 'Staffing & Recruiting', url: '/jobs/collections/staffing-and-recruiting/' },
  { id: 'food-and-beverages', name: 'Food & Beverages', url: '/jobs/collections/food-and-beverages/' },
  { id: 'apparel-and-fashion', name: 'Apparel & Fashion', url: '/jobs/collections/apparel-and-fashion/' },
  { id: 'non-profits', name: 'Non-Profits', url: '/jobs/collections/non-profits/' },
  { id: 'digital-security', name: 'Digital Security', url: '/jobs/collections/digital-security/' },
  { id: 'higher-edu', name: 'Higher Education', url: '/jobs/collections/higher-edu/' },
  { id: 'civil-eng', name: 'Civil Engineering', url: '/jobs/collections/civil-eng/' },
  { id: 'publishing', name: 'Publishing', url: '/jobs/collections/publishing/' },
  { id: 'human-services', name: 'Human Services', url: '/jobs/collections/human-services/' },
  { id: 'msft-climate-innovation-fund', name: 'Climate Innovation', url: '/jobs/collections/msft-climate-innovation-fund/' }
] as const

export const SCAN_DEFAULTS = {
  delayBetweenJobs: 2000,
  delayBetweenPages: 4000,
  longPauseInterval: 25,
  longPauseDuration: 10000
}

export const APP_NAME = 'JobSifter'

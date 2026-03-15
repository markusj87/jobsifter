import type { Page } from 'playwright'

export async function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min) + min)
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export interface ScrollResult {
  jobCount: number
  containerInfo: string
}

export async function scrollJobListToBottom(page: Page): Promise<ScrollResult> {
  // Find what scroll container exists
  const containerInfo = await page.evaluate(() => {
    const selectors = [
      '.scaffold-layout__list',
      '.scaffold-layout__list-container',
      '.jobs-search-results-list',
      '.scaffold-layout__list-detail-inner',
      '.scaffold-layout__inner'
    ]
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) {
        return `${sel} (scrollH=${el.scrollHeight}, clientH=${el.clientHeight}, children=${el.children.length})`
      }
    }
    const link = document.querySelector('a[href*="/jobs/view/"]')
    if (link) {
      let p = link.parentElement
      const chain: string[] = []
      for (let d = 0; d < 6 && p; d++) {
        chain.push(`${p.tagName}.${(p.className || '').substring(0, 30)}(sH=${p.scrollHeight},cH=${p.clientHeight})`)
        p = p.parentElement
      }
      return 'Ancestor chain: ' + chain.join(' > ')
    }
    return 'No job links found'
  })

  let previousCount = 0
  let stableRounds = 0

  for (let i = 0; i < 20; i++) {
    const currentCount = await page.evaluate(() => {
      const seen = new Set<string>()
      const links = document.querySelectorAll('a[href*="/jobs/view/"]')
      for (const a of links) {
        const href = a.getAttribute('href') || ''
        const match = href.match(/\/jobs\/view\/(\d+)/)
        if (match) seen.add(match[1])
      }
      return seen.size
    })

    if (currentCount === previousCount) {
      stableRounds++
      if (stableRounds >= 3) {
        return { jobCount: currentCount, containerInfo }
      }
    } else {
      stableRounds = 0
      previousCount = currentCount
    }

    // Scroll everything we can find
    await page.evaluate(() => {
      // Known LinkedIn containers
      const selectors = [
        '.scaffold-layout__list',
        '.scaffold-layout__list-container',
        '.jobs-search-results-list',
        '.scaffold-layout__list-detail-inner',
        '.scaffold-layout__inner'
      ]

      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el && el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight
        }
      }

      // Scroll main
      const mainEl = document.querySelector('main') || document.querySelector('[role="main"]')
      if (mainEl) mainEl.scrollTop = mainEl.scrollHeight

      // Scroll window
      window.scrollTo(0, document.body.scrollHeight)

      // Find scrollable ancestor of job cards
      const firstJobLink = document.querySelector('a[href*="/jobs/view/"]')
      if (firstJobLink) {
        let parent = firstJobLink.parentElement
        for (let depth = 0; depth < 10 && parent; depth++) {
          if (parent.scrollHeight > parent.clientHeight + 50) {
            parent.scrollTop = parent.scrollHeight
          }
          parent = parent.parentElement
        }
      }
    })

    await randomDelay(1000, 1500)
  }

  return { jobCount: previousCount, containerInfo }
}

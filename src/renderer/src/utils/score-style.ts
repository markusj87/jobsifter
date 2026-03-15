export const SCORE_THRESHOLDS = { HIGH: 70, MEDIUM: 40 } as const

/** Returns background and color CSS variables based on match score */
export function scoreStyle(score: number | null): { background: string; color: string } {
  if (score === null)
    return { background: 'var(--color-surface-hover)', color: 'var(--color-text-quaternary)' }
  if (score >= SCORE_THRESHOLDS.HIGH)
    return { background: 'var(--color-green-soft)', color: 'var(--color-green-text)' }
  if (score >= SCORE_THRESHOLDS.MEDIUM)
    return { background: 'var(--color-yellow-soft)', color: 'var(--color-yellow-text)' }
  return { background: 'var(--color-red-soft)', color: 'var(--color-red-text)' }
}

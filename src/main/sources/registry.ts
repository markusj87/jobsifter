/**
 * Source registry - central lookup for all available job sources.
 */

import type { JobSource } from './types'
import { LinkedInSource } from './linkedin'
import { IndeedSource } from './indeed'
import { PlatsbankenSource } from './platsbanken'
import { RemoteOKSource } from './remoteok'

const sources: Map<string, JobSource> = new Map()

function register(source: JobSource): void {
  sources.set(source.id, source)
}

// Register all built-in sources
register(new LinkedInSource())
register(new IndeedSource())
register(new PlatsbankenSource())
register(new RemoteOKSource())

/** Get a source by its ID, or undefined if not found. */
export function getSource(id: string): JobSource | undefined {
  return sources.get(id)
}

/** Get all registered sources. */
export function getAllSources(): JobSource[] {
  return Array.from(sources.values())
}

/** Get serializable source info for the renderer process. */
export function getSourcesInfo(): { id: string; name: string; type: string; requiresAuth: boolean; description: string }[] {
  return getAllSources().map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    requiresAuth: s.requiresAuth,
    description: s.description
  }))
}

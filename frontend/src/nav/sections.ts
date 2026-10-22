import { TRACKS } from '@/content/learn'

export type SectionId = 'practice' | 'learn' | 'git' | 'progress'
export interface Tab { label: string; to: string; /** Extra path prefixes that belong to this tab. */ also?: string[]; /** Match `to` exactly instead of as a prefix. */ end?: boolean }
export interface Section { id: SectionId; label: string; to: string }

export const SECTIONS: Section[] = [
  { id: 'practice', label: 'Practice', to: '/app' },
  { id: 'learn', label: 'Learn', to: '/learn' },
  { id: 'git', label: 'Git', to: '/git' },
  { id: 'progress', label: 'Progress', to: '/level' },
]

const TABS: Record<SectionId, () => Tab[]> = {
  practice: () => [
    { label: 'Workspace', to: '/app' },
    { label: 'Roadmap', to: '/roadmap' },
    { label: 'Today', to: '/today' },
    { label: 'Tests', to: '/tests', also: ['/test'] },
  ],
  learn: () => [
    { label: 'Overview', to: '/learn', end: true },
    ...TRACKS.map((t) => ({ label: t.short, to: `/learn/${t.id}` })),
    { label: 'Projects', to: '/projects' },
  ],
  git: () => [
    { label: 'Challenges', to: '/git', end: false },
    { label: 'Repo health', to: '/git/health' },
  ],
  progress: () => [
    { label: 'DSA level', to: '/level', end: true },
    { label: 'Core CS level', to: '/level/core' },
    { label: 'Resume projects', to: '/resume' },
  ],
}

export const sectionTabs = (id: SectionId): Tab[] => TABS[id]()

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)
const matches = (path: string, t: Tab) =>
  t.end ? path === t.to : [t.to, ...(t.also ?? [])].some((p) => under(path, p))

/** The most specific tab for a pathname (so /git/health beats the /git prefix), or null. */
export function tabFor(pathname: string): Tab | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  let best: Tab | null = null
  for (const s of SECTIONS) {
    for (const t of sectionTabs(s.id)) {
      if (matches(path, t) && (!best || t.to.length > best.to.length)) best = t
    }
  }
  return best
}

export function sectionFor(pathname: string): SectionId | null {
  const tab = tabFor(pathname)
  if (!tab) return null
  return SECTIONS.find((s) => sectionTabs(s.id).includes(tab) || sectionTabs(s.id).some((t) => t.to === tab.to))?.id ?? null
}

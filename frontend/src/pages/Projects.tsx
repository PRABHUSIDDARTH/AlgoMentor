import { Link } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { TRACKS } from '@/content/learn'
import { PROJECTS } from '@/content/learn/projects'
import { checkKey } from '@/learn/repos'
import { useGit } from '@/learn/useGit'

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const

/** Every project, grouped by track, with how many of its Git milestones you have passed. */
export default function Projects() {
  const git = useGit()
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          eyebrow="Learn"
          title="Projects"
          summary="Build each one in your own repository, then let the Git milestones check that your history shows real work."
        />
        <div className="grid gap-8 xl:grid-cols-3">
          {TRACKS.map((t) => (
            <section key={t.id} aria-labelledby={`proj-${t.id}`} className="grid content-start gap-3">
              <h2 id={`proj-${t.id}`} className="text-[18px] font-semibold">{t.title}</h2>
              <ul aria-label={`${t.title} projects`} className="grid gap-3">
                {PROJECTS.filter((p) => p.track === t.id).map((p) => {
                  const passed = p.gitMilestones.filter((m) => git.checks[checkKey(p.id, m)]?.passedAt !== undefined).length
                  return (
                    <li key={p.id} className="grid gap-1.5 rounded-lg border border-line bg-sand px-5 py-4">
                      <p className="eyebrow">{LEVEL[p.level]}</p>
                      <Link to={`/projects/${p.id}`} className="text-[16px] font-semibold underline-offset-[3px] hover:underline">{p.title}</Link>
                      <p className="text-[13px] leading-relaxed text-ink-muted">{p.goal}</p>
                      <p className="font-mono text-[12px] text-ink-muted">{passed} of {p.gitMilestones.length} Git milestones</p>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

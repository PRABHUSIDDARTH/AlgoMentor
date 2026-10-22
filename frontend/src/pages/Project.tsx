import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { LearnNav } from '@/components/learn/LearnNav'
import { MilestoneList } from '@/components/learn/MilestoneList'
import { RepoLink } from '@/components/learn/RepoLink'
import { PROJECT_BY_ID } from '@/content/learn/projects'
import { TRACK_BY_ID } from '@/content/learn'
import { useGit } from '@/learn/useGit'

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const

function Section({ id, title, items }: { id: string; title: string; items: string[] }) {
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h2 id={id} className="text-[18px] font-semibold">{title}</h2>
      <ul className="grid max-w-[72ch] gap-1.5 pl-5 text-[14px] leading-relaxed [&>li]:list-disc [&>li]:marker:text-sage">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  )
}

/** A project spec and its Git milestones. This page never calls the AI mentor. */
export default function Project() {
  const { projectId = '' } = useParams()
  const project = PROJECT_BY_ID.get(projectId)
  const git = useGit()

  if (!project) {
    return (
      <AppShell>
        <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Project not found</h1>
          <Link to="/learn" className="underline underline-offset-[3px]">Back to Learn</Link>
        </div>
      </AppShell>
    )
  }

  const track = TRACK_BY_ID.get(project.track)!
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_380px] xl:px-20">
        <article className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-7">
          <LearnNav />
          <header className="grid gap-2">
            <p className="eyebrow">
              <Link to={`/learn/${track.id}`} className="hover:underline">{track.short}</Link> · {LEVEL[project.level]} project
            </p>
            <h1 className="display text-[30px] leading-tight xl:text-[36px]">{project.title}</h1>
            <p className="max-w-[72ch] text-[14.5px] leading-relaxed text-ink-muted">{project.goal}</p>
          </header>
          <Section id="proj-proves" title="What it proves" items={project.proves} />
          <Section id="proj-req" title="Requirements" items={project.requirements} />
          <Section id="proj-stretch" title="Stretch goals" items={project.stretch} />
          <Section id="proj-accept" title="Acceptance checklist" items={project.acceptance} />
          <section aria-labelledby="proj-stack" className="grid gap-2">
            <h2 id="proj-stack" className="text-[18px] font-semibold">Suggested stack</h2>
            <p className="max-w-[72ch] text-[14px] leading-relaxed">{project.stack}</p>
          </section>
        </article>

        <aside aria-label="Your repository" className="grid content-start gap-5 xl:sticky xl:top-6 xl:self-start">
          <section aria-labelledby="proj-repo" className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <h2 id="proj-repo" className="text-[16px] font-semibold">Your repository</h2>
            <RepoLink scope={project.id} linked={git.repos[project.id]} />
          </section>
          <section aria-labelledby="proj-git" className="grid gap-3">
            <h2 id="proj-git" className="text-[16px] font-semibold">Git milestones</h2>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">Practise Git in this project's repository. Checks read public GitHub data only: no code is read and no AI is involved.</p>
            <MilestoneList scope={project.id} milestones={project.gitMilestones} git={git} />
          </section>
        </aside>
      </div>
    </AppShell>
  )
}

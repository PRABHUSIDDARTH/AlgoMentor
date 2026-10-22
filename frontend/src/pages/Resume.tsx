import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { ResumeCard } from '@/components/learn/ResumeCard'
import { matchesFilter, RESUME_PROJECTS, type CompanyFilter, type RoleFilter } from '@/content/learn/resume-projects'
import { COMPANY_LABEL, ROLE_LABEL } from '@/content/targets'

const SELECT = 'h-9 rounded-md border border-line-strong bg-cream px-3 text-[13.5px] text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** Projects that get a resume shortlisted, how to write them up, and a repository checklist. No AI on this page. */
export default function Resume() {
  const [company, setCompany] = useState<CompanyFilter>('all')
  const [role, setRole] = useState<RoleFilter>('all')
  const shown = RESUME_PROJECTS.filter((p) => matchesFilter(p, company, role))
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <header className="grid gap-2">
          <p className="eyebrow">Resume projects</p>
          <h1 className="display text-[32px] leading-tight xl:text-[38px]">Projects a recruiter remembers.</h1>
          <p className="max-w-[72ch] text-[14px] leading-relaxed text-ink-muted">
            Twelve projects that show depth, each with the resume line to write about it and a checklist that makes the repository look the part.
          </p>
        </header>

        <section aria-labelledby="resume-how" className="grid max-w-[80ch] gap-3 rounded-lg border border-line bg-sand px-5 py-5">
          <h2 id="resume-how" className="text-[17px] font-semibold">How to write the bullet</h2>
          <ol className="grid gap-1.5 pl-5 text-[13.5px] leading-relaxed [&>li]:list-decimal [&>li]:marker:text-ink-muted">
            <li>Start with a strong verb and say what you built and with what: "Built a rate limiter in Go backed by Redis".</li>
            <li>Name the hard part: the technique or decision that shows you understood the problem.</li>
            <li>End with a number you measured: load, latency, size, tests, users.</li>
          </ol>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            Never invent a number. Interviewers ask how you measured it, so run a benchmark or count something real. The numbers in the examples are illustrations, not targets.
          </p>
        </section>

        <section aria-labelledby="resume-list" className="grid gap-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <h2 id="resume-list" className="sr-only">Projects</h2>
            <label className="grid gap-1 text-[12.5px] font-medium">
              Target
              <select className={SELECT} value={company} onChange={(e) => setCompany(e.target.value as CompanyFilter)}>
                <option value="all">Any</option>
                {(Object.keys(COMPANY_LABEL) as (keyof typeof COMPANY_LABEL)[]).map((c) => <option key={c} value={c}>{COMPANY_LABEL[c]}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[12.5px] font-medium">
              Role
              <select className={SELECT} value={role} onChange={(e) => setRole(e.target.value as RoleFilter)}>
                <option value="all">Any</option>
                {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <p role="status" className="pb-2 font-mono text-[12px] text-ink-muted">{shown.length} {shown.length === 1 ? 'project' : 'projects'}</p>
          </div>
          {shown.length === 0 && <p className="text-[13.5px] text-ink-muted">No project matches both choices. Set one of them to Any.</p>}
          <ul aria-label="Resume projects" className="grid gap-5 xl:grid-cols-2">
            {shown.map((p) => <ResumeCard key={p.id} project={p} />)}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}

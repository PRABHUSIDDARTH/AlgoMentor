import { useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ContributeDialog } from '@/components/learn/ContributeDialog'
import { ResumeCard } from '@/components/learn/ResumeCard'
import { SharedProjects } from '@/components/learn/SharedProjects'
import { matchesFilter, RESUME_PROJECTS, type CompanyFilter, type FocusFilter, type RoleFilter } from '@/content/learn/resume-projects'
import { COUNTRIES, DIRECTORY } from '@/content/directory'
import { employerFor } from '@/content/companies'
import { FOCUS_LABEL, ROLE_LABEL, TIER_LABEL } from '@/content/targets'
import { useSettings } from '@/practice/useSettings'

const SELECT = 'h-9 rounded-md border border-line-strong bg-cream px-3 text-[13.5px] text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

/** Projects that get a resume shortlisted, how to write them up, and a repository checklist. No AI on this page. */
export default function Resume() {
  const [settings] = useSettings()
  const dream = employerFor(settings.target)
  const [company, setCompany] = useState<CompanyFilter>('all')
  const [employerId, setEmployerId] = useState(dream?.id ?? 'all')
  const [role, setRole] = useState<RoleFilter>('all')
  const [focus, setFocus] = useState<FocusFilter>('all')
  const shown = RESUME_PROJECTS.filter((p) => matchesFilter(p, company, role, focus, employerId))
  const employer = DIRECTORY.find((d) => d.id === employerId)
  // The company list only offers companies of the chosen tier, grouped by country.
  const byCountry = useMemo(() => {
    const groups = new Map<string, typeof DIRECTORY>()
    for (const d of DIRECTORY.filter((x) => company === 'all' || x.tier === company)) groups.set(d.country, [...(groups.get(d.country) ?? []), d])
    return [...groups.entries()].sort(([a], [b]) => (a === 'IN' ? -1 : b === 'IN' ? 1 : COUNTRIES[a as keyof typeof COUNTRIES].localeCompare(COUNTRIES[b as keyof typeof COUNTRIES])))
  }, [company])
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          crumbs={[{ label: 'Progress', to: '/level' }, { label: 'Resume projects' }]}
          eyebrow="Resume projects"
          title="Projects a recruiter remembers."
          summary={`${RESUME_PROJECTS.length} projects that show depth, for backend, frontend, full stack, mobile, data, DevOps and test engineers. Each has the resume line to write about it and a checklist that makes the repository look the part. Where an idea comes from a public repository or roadmap, the card links to it.`}
        />

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
              <select className={SELECT} value={company} onChange={(e) => {
                const next = e.target.value as CompanyFilter
                setCompany(next)
                // A company belongs to one tier, so a different tier clears it.
                if (employer && next !== 'all' && employer.tier !== next) setEmployerId('all')
              }}>
                <option value="all">Any</option>
                {(Object.keys(TIER_LABEL) as (keyof typeof TIER_LABEL)[]).map((c) => <option key={c} value={c}>{TIER_LABEL[c]}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[12.5px] font-medium">
              Company
              <select className={`${SELECT} max-w-[240px]`} value={employerId} onChange={(e) => setEmployerId(e.target.value)}>
                <option value="all">Any company</option>
                {byCountry.map(([code, list]) => (
                  <optgroup key={code} label={COUNTRIES[code as keyof typeof COUNTRIES]}>
                    {list.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[12.5px] font-medium">
              Role
              <select className={SELECT} value={role} onChange={(e) => setRole(e.target.value as RoleFilter)}>
                <option value="all">Any</option>
                {(Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[12.5px] font-medium">
              Focus
              <select className={SELECT} value={focus} onChange={(e) => setFocus(e.target.value as FocusFilter)}>
                <option value="all">Any</option>
                {(Object.keys(FOCUS_LABEL) as (keyof typeof FOCUS_LABEL)[]).filter((f) => f !== 'general').map((f) => <option key={f} value={f}>{FOCUS_LABEL[f]}</option>)}
              </select>
            </label>
            <p role="status" className="pb-2 font-mono text-[12px] text-ink-muted">{shown.length} {shown.length === 1 ? 'project' : 'projects'}{employer ? ` for ${employer.name}` : ''}</p>
          </div>
          {employer && <p className="max-w-[80ch] text-[12.5px] leading-relaxed text-ink-muted">Projects written for {TIER_LABEL[employer.tier]} companies like {employer.name}. {employer.name} publishes no project list of its own, so these are the projects that suit how companies of that kind hire.</p>}
          {shown.length === 0 && <p className="text-[13.5px] text-ink-muted">No project matches all three choices. Set one of them to Any.</p>}
          <ul aria-label="Resume projects" className="grid gap-5 xl:grid-cols-2">
            {shown.map((p) => <ResumeCard key={p.id} project={p} />)}
          </ul>
        </section>

        <SharedProjects />

        <section aria-labelledby="resume-contribute" className="grid max-w-[80ch] gap-3 rounded-lg border border-line bg-sand px-5 py-5">
          <h2 id="resume-contribute" className="text-[17px] font-semibold">Got in? Pass it on.</h2>
          <p className="text-[13.5px] leading-relaxed">If a project helped you get into your dream company and it is not here, share it. We review every entry before it is published, so nothing appears the moment you send it.</p>
          <ContributeDialog />
        </section>
      </div>
    </AppShell>
  )
}

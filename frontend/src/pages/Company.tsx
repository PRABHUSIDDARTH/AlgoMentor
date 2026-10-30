import { Link, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { companyById } from '@/content/companies'
import { STAGE_GROUPS } from '@/content/stageGroups'
import { TIER_LABEL } from '@/content/targets'
import { STAGES } from '@/content/roadmap'
import { useSettings } from '@/practice/useSettings'

const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const STAGE_TITLE = new Map(STAGES.map((s) => [s.id, s.title]))

/** One company: how it hires, round by round, with the pages that information came from. */
export default function Company() {
  const { companyId = '' } = useParams()
  const company = companyById(companyId)
  const [settings, update] = useSettings()

  if (!company) {
    return (
      <AppShell>
        <div className="grid content-start gap-3 px-6 py-10 sm:px-10 lg:px-14">
          <h1 className="display text-[28px]">Company not found</h1>
          <Link to="/companies" className="underline underline-offset-[3px]">All companies</Link>
        </div>
      </AppShell>
    )
  }

  const isTarget = settings.target.employer === company.id && settings.target.company === company.tier
  const emphasised = STAGE_GROUPS.filter((g) => company.emphasis?.[g.id] !== undefined)

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_360px] xl:px-20">
        <article className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-7">
          <PageHeader
            crumbs={[{ label: 'Companies', to: '/companies' }, { label: company.name }]}
            eyebrow={TIER_LABEL[company.tier]}
            title={company.name}
            summary={company.summary}
          />
          {company.reported && (
            <p role="note" className="max-w-[72ch] border-l-2 border-sage pl-3 text-[13.5px] leading-relaxed">
              {company.name} publishes no round-by-round guide, so this page is built from candidate reports. It may not match your team, so confirm the stages with your recruiter.
            </p>
          )}

          <section aria-labelledby="co-process" className="grid gap-3">
            <h2 id="co-process" className="text-[18px] font-semibold">Interview process</h2>
            <ol aria-label="Interview process" className="grid max-w-[80ch] gap-0 border-l border-line-strong pl-6">
              {company.rounds.map((r, i) => (
                <li key={r.name} className="relative pb-6 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[31px] top-0.5 grid size-[11px] place-items-center rounded-full border-2 border-sage bg-cream" />
                  <p className="font-mono text-[11.5px] text-ink-muted">Stage {i + 1}</p>
                  <h3 className="text-[16px] font-semibold">{r.name}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed">{r.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          {company.notes && (
            <section aria-labelledby="co-notes" className="grid gap-2">
              <h2 id="co-notes" className="text-[18px] font-semibold">Worth knowing</h2>
              <p className="max-w-[72ch] text-[14px] leading-relaxed">{company.notes}</p>
            </section>
          )}
        </article>

        <aside aria-label="Use this company" className="grid content-start gap-5 xl:sticky xl:top-6 xl:self-start">
          <section aria-labelledby="co-target" className="grid gap-3 rounded-lg border border-line bg-sand px-5 py-5">
            <h2 id="co-target" className="text-[16px] font-semibold">Your target</h2>
            {isTarget ? (
              <p className="text-[14px] font-medium">{company.name} is your target.</p>
            ) : (
              <Button
                className="justify-self-start bg-sage font-semibold text-on-sage hover:bg-sage/90"
                onClick={() => update({ ...settings, target: { ...settings.target, company: company.tier, employer: company.id } })}
              >
                Set {company.name} as my target
              </Button>
            )}
            <p className="text-[12.5px] leading-relaxed text-ink-muted">Keeps your level and focus. Change them in Settings.</p>
          </section>

          <section aria-labelledby="co-plan" className="grid gap-2">
            <h2 id="co-plan" className="text-[16px] font-semibold">What it changes in your plan</h2>
            {emphasised.length > 0 ? (
              <>
                <p className="text-[13px] leading-relaxed text-ink-muted">With {company.name} as your target these stages count most, because its own guide names them:</p>
                <ul className="grid gap-1 text-[13.5px]">
                  {emphasised.flatMap((g) => g.stages.map((id) => <li key={id}>{STAGE_TITLE.get(id) ?? id}</li>))}
                </ul>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-muted">{company.name} does not say which topics it tests, so your plan follows the {TIER_LABEL[company.tier]} weights.</p>
            )}
          </section>

          <section aria-labelledby="co-sources" className="grid gap-2">
            <h2 id="co-sources" className="text-[16px] font-semibold">Sources</h2>
            <ul aria-label="Sources" className="grid gap-1.5 text-[13.5px]">
              {company.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">{s.label}<span className="sr-only"> (opens in a new tab)</span></a>
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-ink-muted">Last read on {day(company.checked)}.</p>
          </section>
        </aside>
      </div>
    </AppShell>
  )
}

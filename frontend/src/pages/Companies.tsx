import { Link } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { companiesByTier } from '@/content/companies'
import { TIER_LABEL } from '@/content/targets'
import { TIERS } from '@/practice/store'
import { useSettings } from '@/practice/useSettings'

/** Real companies, grouped by tier, with how each one hires and where that came from. */
export default function Companies() {
  const [settings] = useSettings()
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-9 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          eyebrow="Progress"
          title="Companies"
          summary="How real companies hire, taken from their own careers pages. Pick one as your target and the roadmap, Today and your readiness follow it. Hiring processes change, so every page says when it was last read."
        />
        {TIERS.map((tier) => (
          <section key={tier} aria-labelledby={`tier-${tier}`} className="grid gap-3">
            <h2 id={`tier-${tier}`} className="text-[20px] font-semibold">{TIER_LABEL[tier]}</h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {companiesByTier(tier).map((c) => (
                <li key={c.id} className="flex">
                  <Link to={`/companies/${c.id}`} className="group flex w-full flex-col gap-2 rounded-lg border border-line bg-cream px-5 py-4 transition-colors hover:border-ink">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[17px] font-semibold group-hover:underline group-hover:underline-offset-[3px]">{c.name}</span>
                      <span className="font-mono text-[11.5px] text-ink-muted">{c.rounds.length} stages</span>
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-ink-muted">{c.summary}</span>
                    <span className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[12px] text-ink-muted">
                      {c.reported && <span>From candidate reports</span>}
                      {settings.target.employer === c.id && settings.target.company === c.tier && <span className="font-medium text-ink">Your target</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  )
}

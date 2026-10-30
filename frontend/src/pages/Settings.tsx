import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { DreamCompanyPicker } from '@/components/settings/DreamCompanyPicker'
import { IdentityForm } from '@/components/settings/IdentityForm'
import { ProfileCard } from '@/components/settings/ProfileCard'
import { FOCUS_LABEL, ROLE_LABEL, TIER_LABEL } from '@/content/targets'
import type { Site } from '@/practice/profileUrls'
import { FOCUSES, ROLES, TIERS, type DailyGoal, type Focus, type Role, type Tier } from '@/practice/store'
import { useSettings, useStats } from '@/practice/useSettings'
import { cn } from '@/lib/utils'

const TIER_OPTIONS = TIERS.map((t) => [t, TIER_LABEL[t]] as [Tier, string])
const ROLE_OPTIONS = ROLES.map((r) => [r, ROLE_LABEL[r]] as [Role, string])
const FOCUS_OPTIONS = FOCUSES.map((f) => [f, FOCUS_LABEL[f]] as [Focus, string])
const GOALS: DailyGoal[] = [2, 3, 5]
const SITES: Site[] = ['leetcode', 'hackerrank', 'gfg', 'github']

function Choice<T extends string | number>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-[12px] text-ink-muted">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map(([v, text]) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={v === value}
            onClick={() => onChange(v)}
            className={cn('rounded-md border px-3 py-1.5 text-[12.5px]', v === value ? 'border-ink bg-ink text-cream' : 'border-line-strong hover:border-ink')}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Everything about you: identity for the card, the profiles AlgoMentor reads, your target and your daily goal. */
export default function Settings() {
  const [settings, update] = useSettings()
  const stats = useStats()

  const setUser = (site: Site, user?: string) => {
    const next = { ...settings }
    if (user) next[site] = user
    else delete next[site]
    update(next)
  }

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          crumbs={[{ label: 'About', to: '/about' }, { label: 'Settings' }]}
          eyebrow="About"
          title="Settings"
          summary="Saved in this browser. AlgoMentor reads public profile data only and never asks for passwords."
        />
        <div className="grid gap-8 xl:grid-cols-2">
          <section aria-labelledby="s-you" className="grid content-start gap-2.5">
            <h2 id="s-you" className="text-[18px] font-semibold">You</h2>
            <IdentityForm settings={settings} onSave={update} />
          </section>

          <section aria-labelledby="s-target" className="grid content-start gap-3">
            <h2 id="s-target" className="text-[18px] font-semibold">Target</h2>
            <DreamCompanyPicker target={settings.target} onChange={(target) => update({ ...settings, target })} />
            <Choice
              label="Tier"
              options={TIER_OPTIONS}
              value={settings.target.company}
              onChange={(company) => {
                // A company belongs to one tier, so changing tier clears it.
                const { employer: _dropped, ...rest } = settings.target
                update({ ...settings, target: { ...rest, company } })
              }}
            />
            <Choice label="Level" options={ROLE_OPTIONS} value={settings.target.role} onChange={(role) => update({ ...settings, target: { ...settings.target, role } })} />
            <Choice label="Focus" options={FOCUS_OPTIONS} value={settings.target.focus ?? 'general'} onChange={(focus) => update({ ...settings, target: { ...settings.target, focus } })} />
          </section>

          <section aria-labelledby="s-profiles" className="grid content-start gap-2.5 xl:col-span-2">
            <h2 id="s-profiles" className="text-[18px] font-semibold">Profiles</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {SITES.map((site) => (
                <ProfileCard
                  key={site}
                  site={site}
                  username={settings[site]}
                  stats={settings[site] ? stats[site] : undefined}
                  onConnect={(u) => setUser(site, u)}
                  onDisconnect={() => setUser(site)}
                />
              ))}
            </div>
            <p className="text-[11.5px] leading-relaxed text-ink-muted">LeetCode shares only your ~20 most recent accepted problems publicly, so older solves sync as topic counts. Stats refresh on their own while the About page is open.</p>
          </section>

          <section aria-labelledby="s-goal" className="grid content-start gap-2.5">
            <h2 id="s-goal" className="text-[18px] font-semibold">Daily goal</h2>
            <Choice label="New problems per day" options={GOALS.map((g) => [g, `${g} a day`] as [DailyGoal, string])} value={settings.dailyGoal} onChange={(dailyGoal) => update({ ...settings, dailyGoal })} />
          </section>
        </div>
      </div>
    </AppShell>
  )
}

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import type { Site } from '@/practice/profileUrls'
import type { Company, DailyGoal, Role } from '@/practice/store'
import { useSettings, useStats } from '@/practice/useSettings'
import { cn } from '@/lib/utils'
import { ProfileCard } from './ProfileCard'

const COMPANIES: [Company, string][] = [['faang', 'FAANG / product'], ['startup', 'Startup'], ['service', 'Service company']]
const ROLES: [Role, string][] = [['intern', 'Intern'], ['sde1', 'SDE-1'], ['sde2', 'SDE-2']]
const GOALS: DailyGoal[] = [2, 3, 5]

function Choice<T extends string | number>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
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
  )
}

export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [settings, update] = useSettings()
  const stats = useStats()

  const setUser = (site: Site, user?: string) => {
    const next = { ...settings }
    if (user) next[site] = user
    else delete next[site]
    update(next)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-sand p-0 text-ink sm:max-w-[420px]">
        <div className="grid gap-6 px-5 py-6">
          <div>
            <SheetTitle className="font-display text-[22px] font-medium">Settings</SheetTitle>
            <SheetDescription className="mt-1 text-[12.5px] text-ink-muted">Saved in this browser. Only public profile data is read; no passwords.</SheetDescription>
          </div>

          <section aria-labelledby="s-profiles" className="grid gap-2.5">
            <h2 id="s-profiles" className="eyebrow">Profiles</h2>
            {(['leetcode', 'hackerrank', 'gfg'] as const).map((site) => (
              <ProfileCard
                key={site}
                site={site}
                username={settings[site]}
                stats={settings[site] ? stats[site] : undefined}
                onConnect={(u) => setUser(site, u)}
                onDisconnect={() => setUser(site)}
              />
            ))}
            <p className="text-[11.5px] leading-relaxed text-ink-muted">LeetCode shares only your ~20 most recent accepted problems publicly, so older solves sync as topic counts.</p>
          </section>

          <section aria-labelledby="s-target" className="grid gap-2.5">
            <h2 id="s-target" className="eyebrow">Target</h2>
            <Choice label="Company" options={COMPANIES} value={settings.target.company} onChange={(company) => update({ ...settings, target: { ...settings.target, company } })} />
            <Choice label="Role" options={ROLES} value={settings.target.role} onChange={(role) => update({ ...settings, target: { ...settings.target, role } })} />
          </section>

          <section aria-labelledby="s-goal" className="grid gap-2.5">
            <h2 id="s-goal" className="eyebrow">Daily goal</h2>
            <Choice label="New problems per day" options={GOALS.map((g) => [g, `${g} a day`] as [DailyGoal, string])} value={settings.dailyGoal} onChange={(dailyGoal) => update({ ...settings, dailyGoal })} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

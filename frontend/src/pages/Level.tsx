import { useEffect } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ReadinessMeter } from '@/components/practice/ReadinessMeter'
import { COMPANY_LABEL, ROLE_LABEL } from '@/content/targets'
import { WEIGHTS, type Component } from '@/practice/level'
import { useLevel } from '@/practice/useLevel'

const LEVEL_KEY = 'algomentor.level.v1'
const NAMES: Record<Component, { name: string; what: string }> = {
  coverage: { name: 'Coverage', what: 'Roadmap solved, weighted by your target' },
  difficulty: { name: 'Difficulty', what: 'Share of Medium and Hard problems' },
  retention: { name: 'Retention', what: 'Reviews passed in the last 30 days' },
  tests: { name: 'Tests', what: 'Average of your last 3 tests' },
  consistency: { name: 'Consistency', what: 'Active days in the last 14' },
  external: { name: 'External', what: 'Connected LeetCode solves (up to 400)' },
}

/** Shows a short, calm message the first time a higher level is reached. */
export function useLevelUpNotice(level: number) {
  useEffect(() => {
    let last = 1
    try {
      last = Number(localStorage.getItem(LEVEL_KEY)) || 1
    } catch {
      // ignore
    }
    if (level > last) toast.success(`Level up: you're now level ${level}`)
    if (level !== last) {
      try {
        localStorage.setItem(LEVEL_KEY, String(level))
      } catch {
        // ignore
      }
    }
  }, [level])
}

export default function Level() {
  const { level, total, parts, readiness, gaps, input } = useLevel()
  useLevelUpNotice(level)
  const targetLabel = `${COMPANY_LABEL[input.target.company]} ${ROLE_LABEL[input.target.role]}`
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:px-20">
        <div className="grid content-start gap-6">
          <PageHeader eyebrow="Placement readiness" title={`Level ${level}`}>
            <p className="font-mono text-[12px] text-ink-muted">Score {Math.round(total)} of 100 · levels run 1 to 10</p>
          </PageHeader>
          <ReadinessMeter value={readiness} label={`Readiness for ${targetLabel}`} />
          <section aria-labelledby="next" className="grid gap-2.5">
            <h2 id="next" className="text-[16px] font-semibold">What to do next</h2>
            <ol aria-label="What to do next" className="grid gap-2">
              {gaps.map((g, i) => (
                <li key={g.component} className="flex gap-3 rounded-lg border border-line bg-cream px-4 py-3 text-[14px]">
                  <span className="font-mono text-[12px] text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
                  <span>{g.action}</span>
                </li>
              ))}
            </ol>
            <p className="text-[12.5px] text-ink-muted">
              Change your target in Settings. <Link to="/roadmap" className="text-ink underline underline-offset-[3px]">Open the roadmap</Link>.
              Interviews test more than DSA: see your <Link to="/level/core" className="text-ink underline underline-offset-[3px]">Core CS level</Link>.
            </p>
          </section>
        </div>
        <section aria-labelledby="breakdown" className="grid content-start gap-2.5">
          <h2 id="breakdown" className="text-[16px] font-semibold">Score breakdown</h2>
          <table aria-label="Score breakdown" className="w-full overflow-hidden rounded-lg border border-line bg-cream text-[13.5px]">
            <tbody>
              {(Object.keys(WEIGHTS) as Component[]).map((k) => (
                <tr key={k} className="border-t border-line first:border-t-0">
                  <th scope="row" className="px-4 pt-3 pb-3 text-left align-top font-medium">{NAMES[k].name}</th>
                  <td className="py-3 text-[12px] text-ink-muted">{NAMES[k].what}</td>
                  <td className="px-4 py-3 text-right font-mono text-[12.5px] whitespace-nowrap">{parts[k].toFixed(1)} / {WEIGHTS[k]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  )
}

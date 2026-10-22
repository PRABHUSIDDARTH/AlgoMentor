import { Link } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ReadinessMeter } from '@/components/practice/ReadinessMeter'
import { COMPANY_LABEL } from '@/content/targets'
import { CORE_WEIGHTS, type CoreComponent } from '@/learn/coreReadiness'
import { useCore } from '@/learn/useCore'

const CORE_NAMES: Record<CoreComponent, { name: string; what: string }> = {
  modules: { name: 'Modules', what: 'Lessons completed (databases and networks count more for service companies)' },
  quiz: { name: 'Quizzes', what: 'Average best quiz score across all modules' },
  projects: { name: 'Projects', what: 'Projects with every Git milestone passed' },
  git: { name: 'Git challenges', what: 'Challenges passed in your own repositories' },
}

export default function LevelCore() {
  const core = useCore()
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <section aria-label="Core CS level" className="grid content-start gap-6">
          <PageHeader
            eyebrow="Progress"
            title="Core CS level"
            summary="Interviews test more than data structures. This is how ready you are on the Learn tracks and Git. Your overall readiness on Today is the lower of this and your DSA level, because interviews test both."
          />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="grid content-start gap-5">
              <ReadinessMeter value={core.readiness} label={`Core CS readiness for ${COMPANY_LABEL[core.input.target.company]}`} />
              <ol aria-label="Core CS: what to do next" className="grid gap-2">
                {core.gaps.map((g, i) => (
                  <li key={g.component} className="flex gap-3 rounded-lg border border-line bg-cream px-4 py-3 text-[14px]">
                    <span className="font-mono text-[12px] text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
                    <span>{g.action}</span>
                  </li>
                ))}
              </ol>
              <p className="text-[12.5px] text-ink-muted">
                <Link to="/learn" className="text-ink underline underline-offset-[3px]">Open Learn</Link>
              </p>
            </div>
            <div className="grid content-start gap-2.5">
            <h3 className="text-[16px] font-semibold">Core CS breakdown</h3>
            <table aria-label="Core CS breakdown" className="w-full overflow-hidden rounded-lg border border-line bg-cream text-[13.5px]">
              <tbody>
                {(Object.keys(CORE_WEIGHTS) as CoreComponent[]).map((k) => (
                  <tr key={k} className="border-t border-line first:border-t-0">
                    <th scope="row" className="px-4 pt-3 pb-3 text-left align-top font-medium">{CORE_NAMES[k].name}</th>
                    <td className="py-3 text-[12px] text-ink-muted">{CORE_NAMES[k].what}</td>
                    <td className="px-4 py-3 text-right font-mono text-[12.5px] whitespace-nowrap">{core.parts[k].toFixed(1)} / {CORE_WEIGHTS[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

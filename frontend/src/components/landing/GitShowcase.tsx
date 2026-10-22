import { Link } from 'react-router'
import { CheckResultView } from '@/components/learn/CheckResultView'
import { ScriptBox } from '@/components/learn/ScriptBox'
import { Section } from './Section'

const SAMPLE = {
  checkedAt: Date.UTC(2026, 9, 22),
  passed: true,
  passedAt: Date.UTC(2026, 9, 22),
  details: [
    { ok: true, text: 'A merge commit with two parents exists on the default branch' },
    { ok: true, text: 'No conflict markers remain in any file' },
    { ok: true, text: 'The merge commit message names the conflict you resolved' },
  ],
}

/** The Git challenges, shown with the real setup commands and a sample check. */
export function GitShowcase() {
  return (
    <Section id="git" eyebrow="04 · Git" title="Fix real Git problems in your own repository.">
      <div className="grid gap-8 xl:grid-cols-2">
        <div className="grid content-start gap-3">
          <p className="max-w-[60ch] text-[14.5px] leading-relaxed">
            Ten situations you will meet at work: a merge conflict, a bad commit to revert, a deleted branch to recover, a secret pushed by mistake. A setup script puts your own clone into the situation, you fix it with Git, and AlgoMentor checks your public repository on GitHub.
          </p>
          <p className="max-w-[60ch] text-[13.5px] leading-relaxed text-ink-muted">
            There is no AI on these pages. You read the brief and use Git yourself; the check only looks at what is on GitHub.
          </p>
          <Link to="/git" className="justify-self-start text-[13.5px] font-medium underline underline-offset-[3px]">See the ten challenges</Link>
          <div className="mt-2 rounded-lg border border-line bg-sand p-4">
            <p className="mb-2 font-mono text-[11.5px] text-ink-muted">Sample result: resolve a merge conflict</p>
            <CheckResultView record={SAMPLE} />
          </div>
        </div>
        <ScriptBox script="conflict" />
      </div>
    </Section>
  )
}

import { ProblemStartForm } from '@/components/ProblemStartForm'

const GROUPS = [
  { name: 'Arrays and hashing', problems: [['1', 'Two Sum', 'Easy'], ['49', 'Group Anagrams', 'Medium']] },
  { name: 'Linked lists and design', problems: [['206', 'Reverse Linked List', 'Easy'], ['146', 'LRU Cache', 'Medium']] },
  { name: 'Graphs', problems: [['200', 'Number of Islands', 'Medium'], ['207', 'Course Schedule', 'Medium']] },
]

export function EmptyState({ onStart, error }: { onStart: (input: string) => void; error?: string }) {
  return (
    <div className="grid w-full content-start gap-5 px-6 py-10 sm:px-10 lg:px-14">
      <h1 className="display text-[30px] leading-tight xl:text-[36px]">What are we solving today?</h1>
      <ProblemStartForm buttonLabel="Start" placeholder="LeetCode number, link, or paste a problem" onSubmit={onStart} className="max-w-[720px]" />
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <p className="text-[12.5px] text-ink-muted">Not sure where to begin? These cover the patterns that come up most in interviews.</p>
      <div data-testid="starter-groups" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {GROUPS.map((g) => (
        <section key={g.name} aria-labelledby={`g-${g.name}`}>
          <h2 id={`g-${g.name}`} className="eyebrow mb-1.5">{g.name}</h2>
          <div className="overflow-hidden rounded-[7px] border border-line bg-sand">
            {g.problems.map(([n, title, diff]) => (
              <button
                key={n}
                type="button"
                onClick={() => onStart(n)}
                className="flex w-full justify-between px-3 py-2.5 text-left text-[13px] hover:bg-cream/60 [&+&]:border-t [&+&]:border-line"
              >
                <span>{n}. {title}</span>
                <span className="font-mono text-[11px] text-ink-muted">{diff}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      </div>
    </div>
  )
}

import { ProblemStartForm } from '@/components/ProblemStartForm'

const GROUPS = [
  { name: 'Arrays and hashing', problems: [['1', 'Two Sum', 'Easy'], ['49', 'Group Anagrams', 'Medium']] },
  { name: 'Linked lists and design', problems: [['206', 'Reverse Linked List', 'Easy'], ['146', 'LRU Cache', 'Medium']] },
  { name: 'Graphs', problems: [['200', 'Number of Islands', 'Medium'], ['207', 'Course Schedule', 'Medium']] },
]

export function EmptyState({ onStart, error }: { onStart: (input: string) => void; error?: string }) {
  return (
    <div className="mx-auto grid w-full max-w-[560px] content-start gap-4 px-6 py-10">
      <h1 className="display text-[28px] leading-tight">What are we solving today?</h1>
      <ProblemStartForm buttonLabel="Start" placeholder="LeetCode number, link, or paste a problem" onSubmit={onStart} className="max-w-none" />
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <p className="text-[12.5px] text-ink-muted">Not sure where to begin? These cover the patterns that come up most in interviews.</p>
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
  )
}

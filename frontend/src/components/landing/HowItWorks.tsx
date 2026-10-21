import { Section } from './Section'

const STEPS = [
  { title: 'Bring a problem', body: 'Type a LeetCode number or paste any statement. We fetch the full problem for you.' },
  { title: 'Work through hints', body: 'Up to four hints, each more specific than the last. Stop as soon as it clicks.' },
  { title: 'Study the solution', body: 'The optimal approach, code in your language, and time and space complexity explained.' },
]

export function HowItWorks() {
  return (
    <Section id="how" eyebrow="01 · How it works" title="Think first. Reveal later.">
      <ol className="grid border-t border-ink md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="border-line py-5 md:px-5 md:first:pl-0 md:[&+li]:border-l max-md:[&+li]:border-t">
            <span className="font-mono text-[12px] text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2.5 mb-1.5 text-[15px] font-semibold">{s.title}</h3>
            <p className="text-[13.5px] leading-relaxed text-ink-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

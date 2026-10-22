import { Section } from './Section'

const ITEMS = [
  { name: 'GitHub', body: 'Sign in with GitHub, and optionally save accepted solutions to a repository of your choice.' },
  { name: 'LeetCode', body: 'Link your profile to see solved counts by difficulty and get hints on problems you have not cracked yet.' },
  { name: 'HackerRank', body: 'Show your HackerRank badges and track practice alongside your LeetCode progress.' },
]

export function Integrations() {
  return (
    <Section id="integrations" eyebrow="03 · Integrations" title="Connect the accounts you already practise on." className="bg-band text-on-band [&_.eyebrow]:text-band-accent">
      <div className="grid gap-px overflow-hidden rounded-lg border border-on-band/20 bg-on-band/20 md:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.name} className="bg-band p-5">
            <div className="flex items-baseline justify-between font-mono text-[13px] font-semibold">
              {item.name}
              <span className="text-[11px] font-medium text-band-accent">Coming soon</span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-on-band/80">{item.body}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

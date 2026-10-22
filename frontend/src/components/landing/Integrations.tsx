import { Section } from './Section'

const ITEMS = [
  { name: 'LeetCode', body: 'Paste your profile link in Settings to see solved counts by difficulty. They count toward your level, and nothing but public data is read.' },
  { name: 'HackerRank', body: 'Add your HackerRank profile link so your practice there sits beside the rest of your progress.' },
  { name: 'GeeksforGeeks', body: 'Add your GfG profile link to track the problems you have solved on the practice site.' },
]

export function Integrations() {
  return (
    <Section id="integrations" eyebrow="05 · Connections" title="Bring the profiles you already practise on." className="bg-band text-on-band [&_.eyebrow]:text-band-accent">
      <div className="grid gap-px overflow-hidden rounded-lg border border-on-band/20 bg-on-band/20 md:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.name} className="bg-band p-5">
            <h3 className="font-mono text-[13px] font-semibold">{item.name}</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-on-band/80">{item.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-[72ch] text-[12.5px] leading-relaxed text-on-band/70">Open Settings (top right) to connect a profile. AlgoMentor never asks for a password or a cookie.</p>
    </Section>
  )
}

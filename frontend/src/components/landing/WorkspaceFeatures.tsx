import { Section } from './Section'

function MiniStepper() {
  const steps = ['1', '2', '3', '4', 'S']
  return (
    <div className="mt-3.5 mb-2.5 flex items-center" aria-hidden="true">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          {i > 0 && <span className="h-[1.5px] w-6 bg-ink/35" />}
          <span className={
            'grid size-6 place-items-center rounded-full border-[1.5px] font-mono text-[11px] ' +
            (i < 2 ? 'border-ink bg-ink text-cream' : i === 2 ? 'border-sage bg-sage text-on-sage' : 'border-ink')
          }>{s}</span>
        </div>
      ))}
    </div>
  )
}

export function WorkspaceFeatures() {
  return (
    <Section eyebrow="02 · The workspace" title="Built for learning, not copying." className="bg-sand">
      <div className="grid gap-3.5 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="rounded-lg border border-line bg-cream p-5">
          <h3 className="mb-1.5 text-[14px] font-semibold">Progressive hints</h3>
          <p className="text-[13px] leading-relaxed text-ink-muted">See exactly where you are and how much help is left.</p>
          <MiniStepper />
          <p className="font-mono text-[11.5px] text-ink-muted">Hint 3 of 4 · solution locked until you ask</p>
        </div>
        <div className="rounded-lg border border-line bg-cream p-5">
          <h3 className="mb-1.5 text-[14px] font-semibold">Explanations that stream</h3>
          <p className="text-[13px] leading-relaxed text-ink-muted">Answers appear as they are written, with code highlighted and one-click copy.</p>
        </div>
        <div className="rounded-lg border border-line bg-cream p-5">
          <h3 className="mb-1.5 text-[14px] font-semibold">Your recent problems</h3>
          <p className="text-[13px] leading-relaxed text-ink-muted">Pick up where you left off. Your recent problems are saved in this browser.</p>
        </div>
      </div>
    </Section>
  )
}

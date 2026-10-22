import { useState } from 'react'
import { HintCard } from '@/components/workspace/HintCard'
import { HintStepper } from '@/components/workspace/HintStepper'
import { Button } from '@/components/ui/button'
import { Section } from './Section'

const STATEMENT = 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Exactly one solution exists, and you may not use the same element twice.'

const HINTS = [
  'Before you code, say out loud what a pair needs to look like. For a number `x`, what is the other number you are hoping to find?',
  'Checking every pair works but takes quadratic time. Ask what you would need to remember about numbers you have already seen so the second one can be found at once.',
  'Walk the array once. At each number, compute the complement `target - x`, look it up in what you stored so far, and only then store `x`.',
  'A hash map from value to index gives constant-time lookup. Store each number after checking, so an element is never paired with itself.',
]

const SOLUTION = 'One pass with a hash map: for each number, if its complement is already in the map you are done, otherwise store the number and its index. Time O(n), space O(n).'

/** A working demo of the hint ladder, built from the workspace's own stepper and cards. */
export function HowItWorks() {
  const [seen, setSeen] = useState(0)
  const revealed = seen > HINTS.length
  const shown = Math.min(seen, HINTS.length)
  return (
    <Section id="how" eyebrow="01 · How it works" title="Think first. Reveal later.">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-3">
          <p className="font-mono text-[12px] text-ink-muted">1. Two Sum · Easy</p>
          <p className="max-w-[60ch] text-[14.5px] leading-relaxed">{STATEMENT}</p>
          <p className="max-w-[52ch] text-[13.5px] leading-relaxed text-ink-muted">
            This is the real hint ladder from the workspace. Ask for one hint at a time, and stop the moment it clicks. The solution stays locked until you have walked all four.
          </p>
        </div>
        <div className="grid content-start gap-4 rounded-lg border border-line bg-sand p-5" aria-label="Hint ladder demo" role="group">
          <HintStepper seen={shown} current={null} revealed={revealed} onSelect={() => {}} />
          <div className="grid min-h-[168px] content-start gap-2.5" aria-live="polite">
            {shown === 0 && <p className="text-[13.5px] text-ink-muted">No hints yet. Try to solve it first, then ask for the first nudge.</p>}
            {HINTS.slice(0, shown).map((h, i) => <HintCard key={i} index={i} text={h} state={i === shown - 1 ? 'latest' : 'past'} />)}
            {revealed && <p className="rounded-lg border border-ink bg-cream px-4 py-3.5 text-[13.5px] leading-relaxed">{SOLUTION}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {shown < HINTS.length && <Button onClick={() => setSeen(shown + 1)} className="bg-ink font-semibold text-cream hover:bg-ink/90">{shown === 0 ? 'Ask for a hint' : 'Next hint'}</Button>}
            {shown === HINTS.length && !revealed && <Button onClick={() => setSeen(HINTS.length + 1)} className="bg-sage font-semibold text-on-sage hover:bg-sage/90">Show the solution</Button>}
            {seen > 0 && <button type="button" onClick={() => setSeen(0)} className="text-[13px] text-ink-muted underline underline-offset-[3px] hover:text-ink">Start over</button>}
          </div>
        </div>
      </div>
    </Section>
  )
}

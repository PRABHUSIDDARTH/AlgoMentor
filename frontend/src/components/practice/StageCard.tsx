import { Lock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Stage } from '@/content/roadmap'
import { targetName } from '@/content/targets'
import { cn } from '@/lib/utils'
import type { Target } from '@/practice/store'
import { ProgressBar } from './ProgressBar'

interface Props {
  stage: Stage
  previousTitle?: string
  solved: number
  total: number
  unlocked: boolean
  current: boolean
  key3: boolean
  target: Target
  offerKnown: boolean
  onUnlock: () => void
  onKnown: () => void
}

export function StageCard({ stage, previousTitle, solved, total, unlocked, current, key3, target, offerKnown, onUnlock, onKnown }: Props) {
  const label = `${stage.order}. ${stage.title}`
  return (
    <li aria-label={label} aria-current={current ? 'step' : undefined} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4">
      <div className="relative flex justify-center">
        <span aria-hidden="true" className="absolute top-0 bottom-0 w-px bg-line" />
        <span
          aria-hidden="true"
          className={cn(
            'relative z-10 mt-4 grid size-9 place-items-center rounded-full border-[1.5px] font-mono text-[12px] font-medium',
            solved === total && total > 0 ? 'border-ink bg-ink text-cream' : current ? 'border-sage bg-sage text-on-sage' : unlocked ? 'border-ink bg-cream' : 'border-line-strong bg-cream text-ink-muted',
          )}
        >
          {unlocked ? stage.order : <Lock className="size-3.5" />}
        </span>
      </div>
      <div className={cn('mb-3 rounded-lg border bg-cream px-5 py-4', current ? 'border-sage shadow-[inset_3px_0_0_var(--sage)]' : 'border-line')}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[16px] font-semibold">
            <Link to={`/roadmap/${stage.id}`} className="hover:underline hover:underline-offset-[3px]">{label}</Link>
          </h2>
          <span className="font-mono text-[11.5px] text-ink-muted">{solved} of {total} solved</span>
        </div>
        <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-ink-muted">{stage.summary}</p>
        <ProgressBar value={total ? solved / total : 0} label={`${stage.title} progress`} className="mt-3" />
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
          {key3 && <span className="font-medium">Key for {targetName(target)}</span>}
          {current && <span className="text-ink-muted">You are here</span>}
          {!unlocked && (
            <>
              <span className="text-ink-muted">Locked · finish 70% of {previousTitle}, or</span>
              <Button size="sm" variant="outline" className="h-7 border-ink bg-transparent text-[12px]" aria-label={`Unlock anyway: ${stage.title}`} onClick={onUnlock}>
                Unlock anyway
              </Button>
            </>
          )}
          {offerKnown && <span className="text-ink-muted">Your LeetCode history covers this stage.</span>}
          {offerKnown && (
            <Button size="sm" variant="ghost" className="h-7 text-[12px] underline underline-offset-[3px]" aria-label={`Mark as known: ${stage.title}`} onClick={onKnown}>
              Mark as known
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

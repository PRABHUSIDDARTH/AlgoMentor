import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The marker for one block of today's plan, sitting on the vertical rule: filled with a tick when the block is finished. */
export function TimelineNode({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-node={done ? 'done' : 'todo'}
      className={cn('absolute top-0 -left-9 grid size-[27px] place-items-center rounded-full border-[1.5px] bg-cream', done ? 'border-sage bg-sage text-on-sage' : 'border-line-strong')}
    >
      {done && <Check className="size-3.5" />}
    </span>
  )
}

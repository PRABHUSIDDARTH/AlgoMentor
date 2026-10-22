import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// shadcn/ui Card, with the app's palette.
function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={cn('grid gap-3 rounded-lg border border-line bg-sand px-5 py-5 text-ink', className)} {...props} />
}
function CardTitle({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-title" className={cn('text-[15px] font-semibold', className)} {...props} />
}
function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-[12.5px] leading-relaxed text-ink-muted', className)} {...props} />
}
export { Card, CardTitle, CardDescription }

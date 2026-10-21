import type { ReactNode } from 'react'
import AnimatedContent from '@/components/bits/AnimatedContent'
import { cn } from '@/lib/utils'

/** A landing section that fades and rises 12px into view once (spec section 9). */
export function Section({ id, eyebrow, title, className, children }: { id?: string; eyebrow: string; title: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn('scroll-mt-20 border-t border-line', className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <AnimatedContent distance={12} duration={0.4} ease="power2.out" threshold={0.15} once className="px-6 sm:px-10 lg:px-16 xl:px-24 py-12 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id ? `${id}-title` : undefined} className="display mt-2 mb-6 text-[30px] leading-tight">{title}</h2>
        {children}
      </AnimatedContent>
    </section>
  )
}

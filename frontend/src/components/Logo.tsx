import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/** Three-node mark (a tiny tree, root highlighted) plus the wordmark. */
export function Logo({ className, to = '/' }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 rounded-md font-display text-[19px] font-semibold', className)}>
      <svg viewBox="0 0 22 22" className="size-[22px]" aria-hidden="true">
        <circle cx="11" cy="4" r="4" fill="var(--sage)" />
        <circle cx="4" cy="18" r="4" fill="currentColor" />
        <circle cx="18" cy="18" r="4" fill="currentColor" />
      </svg>
      AlgoMentor
    </Link>
  )
}

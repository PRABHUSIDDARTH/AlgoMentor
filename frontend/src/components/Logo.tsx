import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/**
 * The AlgoMentor mark: a small binary tree with a leaf on the root (from AlgoMentor-logo.jpeg).
 * Deep parts use --logo-deep so the mark stays visible on dark backgrounds.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="112 56 356 404" className={className} aria-hidden="true" focusable="false">
      <g strokeLinecap="round">
        <line x1="256" y1="196" x2="152" y2="306" stroke="var(--sage)" strokeWidth="30" />
        <line x1="357" y1="306" x2="305" y2="414" stroke="var(--sage)" strokeWidth="28" />
        <line x1="256" y1="196" x2="357" y2="306" stroke="var(--logo-deep)" strokeWidth="30" />
        <line x1="357" y1="306" x2="418" y2="418" stroke="var(--logo-deep)" strokeWidth="28" />
        <line x1="256" y1="140" x2="256" y2="170" stroke="var(--logo-deep)" strokeWidth="22" />
      </g>
      <path data-part="leaf" d="M262 140 C266 96 302 70 350 68 C346 113 314 150 262 140 Z" fill="var(--sage)" />
      <circle cx="256" cy="196" r="42" fill="var(--logo-deep)" />
      <circle cx="152" cy="306" r="34" fill="var(--sage)" />
      <circle cx="357" cy="306" r="38" fill="var(--logo-deep)" />
      <circle cx="305" cy="414" r="33" fill="var(--sage)" />
      <circle cx="418" cy="418" r="38" fill="var(--logo-deep)" />
    </svg>
  )
}

/** Mark plus the "AlgoMentor" wordmark (bold "Algo", regular "Mentor"), linking home. */
export function Logo({ className, to = '/', onBand = false }: { className?: string; to?: string; onBand?: boolean }) {
  return (
    <Link
      to={to}
      aria-label="AlgoMentor home"
      className={cn('inline-flex items-center gap-2.5 rounded-md text-[20px] leading-none tracking-[-0.01em]', className)}
      style={onBand ? ({ '--logo-deep': 'var(--on-band)' } as React.CSSProperties) : undefined}
    >
      <LogoMark className="h-[32px] w-auto" />
      <span className={onBand ? 'text-on-band' : 'text-[var(--logo-deep)]'}>
        <b className="font-bold">Algo</b>
        <span className="font-normal">Mentor</span>
      </span>
    </Link>
  )
}

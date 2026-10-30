import type { CSSProperties, MouseEvent } from 'react'
import GooeyNav, { type GooeyNavItem } from '@/components/bits/GooeyNav'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useResolvedTheme } from '@/lib/useTheme'
import { cn } from '@/lib/utils'

// GooeyNav draws its blob on a canvas, so it needs literal colours rather than CSS variables.
const BLOB = { light: { pill: '#8B9A6E', ink: '#262C1E' }, dark: { pill: '#8B9A6E', ink: '#0E100B' } }

interface Props {
  label: string
  items: GooeyNavItem[]
  activeIndex: number
  size?: 'sm' | 'md'
  frame?: boolean
  particleCount?: number
  className?: string
  onItemClick?: (item: GooeyNavItem, e: MouseEvent) => void
}

/** The React Bits GooeyNav with the app's palette. GooeyNav sets its own display, so responsive hiding lives on the caller's className. */
export function Gooey({ label, items, activeIndex, size = 'sm', frame = false, particleCount = 12, className, onItemClick }: Props) {
  const theme = useResolvedTheme()
  // On phones the nav is a single unframed scrolling row, so it never wraps or crowds the logo.
  const desktop = useMediaQuery('(min-width: 768px)')
  return (
    <div className={cn('[&_a]:whitespace-nowrap [&_ul]:flex-nowrap', className)}>
      <GooeyNav
        aria-label={label}
        items={items}
        activeIndex={activeIndex}
        onItemClick={onItemClick}
        theme={theme}
        color={BLOB[theme].pill}
        activeTextColor={BLOB[theme].ink}
        colors={['#8B9A6E', '#A8B68A', '#56613F']}
        frame={desktop && frame}
        size={desktop ? size : 'sm'}
        particleCount={particleCount}
        style={{ '--gn-ink': 'var(--ink)', '--gn-muted': 'var(--ink-muted)' } as CSSProperties}
      />
    </div>
  )
}

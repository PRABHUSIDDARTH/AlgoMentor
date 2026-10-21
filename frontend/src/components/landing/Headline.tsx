import { m } from 'motion/react'
import { Fragment } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMotionPrefs'

const STAGGER = 0.04 // spec section 5: words fade up with a 40ms stagger, once

/** A thin, slightly uneven hand-drawn stroke that draws itself once under the emphasised word. */
function Underline({ reduce, delay }: { reduce: boolean; delay: number }) {
  return (
    <svg
      data-testid="before-underline"
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[0.06em] left-[-2%] h-[0.22em] w-[104%] overflow-visible"
    >
      <m.path
        d="M3 10.5 C 34 6.5, 64 12.5, 100 8.5 S 168 6, 197 9.5"
        fill="none"
        stroke="var(--sage)"
        strokeWidth="3.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: 'easeInOut', delay }}
      />
    </svg>
  )
}

/**
 * The hero H1. Words reveal one by one; `highlight` gets a hand-drawn sage underline.
 * Screen readers get the sentence once, not word by word.
 */
export function Headline({ text, highlight }: { text: string; highlight: string }) {
  const reduce = usePrefersReducedMotion()
  const words = text.split(' ')
  return (
    <h1 className="display mt-4 mb-5 text-[40px] leading-[1.04] tracking-[-0.03em] sm:text-[52px] xl:text-[60px] 2xl:text-[68px]">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => {
          const marked = word === highlight
          const node = (
            <m.span
              className="inline-block"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * STAGGER }}
            >
              {word}
            </m.span>
          )
          return (
            <Fragment key={i}>
              {marked ? <span className="relative inline-block">{node}<Underline reduce={reduce} delay={words.length * STAGGER + 0.2} /></span> : node}
              {i < words.length - 1 && ' '}
            </Fragment>
          )
        })}
      </span>
    </h1>
  )
}

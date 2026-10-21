import { motion } from 'motion/react'
import { Fragment } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMotionPrefs'

const STAGGER = 0.04 // spec section 5: words fade up with a 40ms stagger, once

/**
 * The hero H1. Words reveal one by one; `highlight` gets the sage marker stroke.
 * Screen readers get the sentence once, not word by word.
 */
export function Headline({ text, highlight }: { text: string; highlight: string }) {
  const reduce = usePrefersReducedMotion()
  const words = text.split(' ')
  return (
    <h1 className="display mt-4 mb-5 text-[40px] leading-[1.04] tracking-[-0.03em] sm:text-[52px]">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => {
          const marked = word === highlight
          const node = (
            <motion.span
              className="inline-block"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * STAGGER }}
            >
              {word}
            </motion.span>
          )
          return (
            <Fragment key={i}>
              {marked ? <span className="bg-[linear-gradient(transparent_60%,var(--sage)_60%,var(--sage)_92%,transparent_92%)]">{node}</span> : node}
              {i < words.length - 1 && ' '}
            </Fragment>
          )
        })}
      </span>
    </h1>
  )
}

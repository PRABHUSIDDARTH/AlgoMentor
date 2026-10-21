import { LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'

const loadFeatures = () => import('@/lib/motionFeatures').then((m) => m.default)

/** Components use `m.*` (not `motion.*`) so only this small shell ships up front. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>
}

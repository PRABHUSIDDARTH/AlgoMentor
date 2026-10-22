import { lazy, Suspense, useEffect, useState } from 'react'
import { cardImages, type DreamCard } from '@/about/dreamCard'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// The React Bits Lanyard pulls in three.js, so it only loads on the page that shows it.
const Lanyard = lazy(() => import('@/components/bits/Lanyard'))

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

export function describeCard(d: DreamCard): string {
  return `Dream ID for ${d.name}: aspiring ${d.role} at ${d.company}, ${d.readiness}% ready`
}

/**
 * The dream ID card hanging from a React Bits Lanyard: drag it, throw it, click to flip it. With reduced motion, or where
 * WebGL or canvas drawing is unavailable, the same card is shown as a still picture.
 */
export function DreamLanyard({ card, steps }: { card: DreamCard; steps: string[] }) {
  const [images, setImages] = useState<{ front: string; back: string; strap: string } | null>(null)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [webgl] = useState(hasWebGL)
  const key = JSON.stringify([card, steps])

  useEffect(() => {
    let live = true
    void cardImages(card, steps).then((i) => { if (live) setImages(i) })
    return () => { live = false }
    // card and steps are covered by key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const label = describeCard(card)
  const still = reduced || !webgl
  return (
    <div role="img" aria-label={label} className="relative h-[620px] w-full overflow-hidden rounded-lg border border-line bg-sand md:h-[680px]">
      {images && !still && (
        <Suspense fallback={null}>
          <Lanyard
            frontImage={images.front}
            backImage={images.back}
            strapImage={images.strap}
            imageFit="cover"
            cardColor="#F7F2EB"
            finish="glossy"
            metal="silver"
            size={0.6}
            strapLength={0.32}
            strapWidth={0.8}
            className="absolute inset-0"
          />
        </Suspense>
      )}
      {images && still && (
        <div className="grid h-full place-items-center p-6">
          <img src={images.front} alt="" className="max-h-full rounded-xl shadow-[0_1px_0_var(--line)]" />
        </div>
      )}
      {!images && <div className="grid h-full place-items-center px-6 text-center text-[13px] text-ink-muted">Printing your card…</div>}
      {images && !still && <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center font-mono text-[11.5px] text-ink-muted">Drag it, throw it, click to flip</p>}
    </div>
  )
}

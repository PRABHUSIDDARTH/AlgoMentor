import { lazy, Suspense } from 'react'
import { Hero } from '@/components/landing/Hero'
import { SiteNav } from '@/components/nav/SiteNav'

const BelowFold = lazy(() => import('@/components/landing/BelowFold'))

export default function Landing() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <SiteNav landing />
      <main id="main">
        <Hero />
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <BelowFold />
        </Suspense>
      </main>
    </>
  )
}

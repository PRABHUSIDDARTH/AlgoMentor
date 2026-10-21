import { Faq } from '@/components/landing/Faq'
import { FinalCta } from '@/components/landing/FinalCta'
import { Footer } from '@/components/landing/Footer'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Integrations } from '@/components/landing/Integrations'
import { Nav } from '@/components/landing/Nav'
import { WorkspaceFeatures } from '@/components/landing/WorkspaceFeatures'

export default function Landing() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <HowItWorks />
        <WorkspaceFeatures />
        <Integrations />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}

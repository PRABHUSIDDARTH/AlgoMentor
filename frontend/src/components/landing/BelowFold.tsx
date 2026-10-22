import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Footer } from './Footer'
import { HowItWorks } from './HowItWorks'
import { Integrations } from './Integrations'
import { WorkspaceFeatures } from './WorkspaceFeatures'

/** Everything under the hero; loaded as its own chunk (it carries GSAP for the scroll reveals). */
export default function BelowFold() {
  return (
    <>
      <HowItWorks />
      <WorkspaceFeatures />
      <Integrations />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  )
}

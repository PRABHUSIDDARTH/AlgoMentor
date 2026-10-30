import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { Footer } from './Footer'
import { HowItWorks } from './HowItWorks'
import { Integrations } from './Integrations'
import { GitShowcase } from './GitShowcase'
import { LearnTracks } from './LearnTracks'
import { RoadmapStrip } from './RoadmapStrip'

/** Everything under the hero; loaded as its own chunk (it carries GSAP for the scroll reveals). */
export default function BelowFold() {
  return (
    <>
      <HowItWorks />
      <RoadmapStrip />
      <LearnTracks />
      <GitShowcase />
      <Integrations />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  )
}

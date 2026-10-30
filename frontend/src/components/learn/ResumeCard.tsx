import { RepoHealth } from '@/components/learn/RepoHealth'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ResumeProject } from '@/content/learn/resume-projects'
import { TIER_LABEL, ROLE_LABEL } from '@/content/targets'

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid max-w-[72ch] gap-1.5 pl-5 text-[13.5px] leading-relaxed [&>li]:list-disc [&>li]:marker:text-sage">
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  )
}

export function ResumeCard({ project }: { project: ResumeProject }) {
  return (
    <li className="grid gap-3 rounded-lg border border-line bg-cream px-5 py-5">
      <div className="grid gap-1">
        <h2 className="text-[19px] font-semibold leading-snug">{project.title}</h2>
        <p className="font-mono text-[11.5px] text-ink-muted">
          {project.targets.map((t) => TIER_LABEL[t]).join(' · ')} — {project.roles.map((r) => ROLE_LABEL[r]).join(' · ')}
        </p>
      </div>
      <p className="max-w-[72ch] text-[14px] leading-relaxed">{project.proves}</p>
      {project.inspiredBy && (
        <p className="text-[12.5px] text-ink-muted">
          Idea from <a href={project.inspiredBy.url} target="_blank" rel="noreferrer" className="underline underline-offset-[3px] hover:text-ink">{project.inspiredBy.label}<span className="sr-only"> (opens in a new tab)</span></a>
        </p>
      )}
      <Accordion type="multiple" defaultValue={['bullet']} className="rounded-lg border border-line px-4">
        <AccordionItem value="bullet">
          <AccordionTrigger className="text-[14px]">Resume bullet</AccordionTrigger>
          <AccordionContent className="grid gap-3 text-[13.5px] leading-relaxed">
            <div className="grid gap-1">
              <p className="eyebrow">Template</p>
              <p className="max-w-[72ch] font-mono text-[12.5px] leading-relaxed text-ink-muted">{project.bullet.template}</p>
            </div>
            <div className="grid gap-1">
              <p className="eyebrow">Example</p>
              <p className="max-w-[72ch]">{project.bullet.example}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="build">
          <AccordionTrigger className="text-[14px]">What to build</AccordionTrigger>
          <AccordionContent className="grid gap-3">
            <div className="grid gap-1.5">
              <p className="eyebrow">Core features</p>
              <Bullets items={project.core} />
            </div>
            <div className="grid gap-1.5">
              <p className="eyebrow">Stretch goals</p>
              <Bullets items={project.stretch} />
            </div>
            <div className="grid gap-1">
              <p className="eyebrow">Tech choices</p>
              <p className="max-w-[72ch] text-[13.5px] leading-relaxed">{project.stack}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="production">
          <AccordionTrigger className="text-[14px]">Build it like production</AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="grid gap-1">
              <p className="eyebrow">How it fits together</p>
              <p className="max-w-[72ch] text-[13.5px] leading-relaxed">{project.production.architecture}</p>
            </div>
            <div className="grid gap-1.5">
              <p className="eyebrow">Build order</p>
              <ol className="grid max-w-[72ch] gap-1.5 pl-5 text-[13.5px] leading-relaxed [&>li]:list-decimal [&>li]:marker:text-ink-muted">
                {project.production.milestones.map((t) => <li key={t}>{t}</li>)}
              </ol>
            </div>
            <div className="grid gap-1.5">
              <p className="eyebrow">Before you call it done</p>
              <Bullets items={project.production.shipIt} />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shine" className="border-b-0">
          <AccordionTrigger className="text-[14px]">Make your GitHub shine</AccordionTrigger>
          <AccordionContent>
            <RepoHealth scope={`resume-${project.id}`} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </li>
  )
}

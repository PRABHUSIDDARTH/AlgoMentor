import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Section } from './Section'

const QUESTIONS = [
  { q: 'Is it free?', a: 'Yes. AlgoMentor is free to use.' },
  { q: 'Will it just give me the answer?', a: 'Only when you ask. Hints come first, and revealing the solution early always asks you to confirm.' },
  { q: 'Which languages are supported?', a: 'Solutions are available in Python, Java and C++.' },
  { q: 'Can it fetch Premium problems?', a: 'No. Premium statements are not public, so paste the problem text instead.' },
]

export function Faq() {
  return (
    <Section id="faq" eyebrow="04 · FAQ" title="Questions, answered.">
      <Accordion type="single" collapsible className="max-w-[720px] border-t border-ink">
        {QUESTIONS.map(({ q, a }) => (
          <AccordionItem key={q} value={q} className="border-line">
            <AccordionTrigger className="text-[15px] font-medium hover:no-underline">{q}</AccordionTrigger>
            <AccordionContent className="text-[14px] leading-relaxed text-ink-muted">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

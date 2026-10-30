import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Section } from './Section'

const QUESTIONS = [
  { q: 'Is it free?', a: 'Yes. AlgoMentor is free to use.' },
  { q: 'Will it just give me the answer?', a: 'Only when you ask. Hints come first, and revealing the solution early always asks you to confirm.' },
  { q: 'Which languages are supported?', a: 'Solutions are available in Python, Java and C++.' },
  { q: 'Do I need an account?', a: 'No. Your progress, tests and Git results are saved in this browser, and nothing is sent to a server except the problem you are working on.' },
  { q: 'Does the AI check my Git work?', a: 'No. The Git challenges are checked only from your public repository on GitHub, with no AI involved.' },
  { q: 'Can it fetch Premium problems?', a: 'No. Premium statements are not public, so paste the problem text instead.' },
]

export function Faq() {
  return (
    <Section id="faq" eyebrow="06 · FAQ" title="Questions, answered.">
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

import { useId } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function InterviewQuestions({ items }: { items: { q: string; a: string }[] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h2 id={id} className="text-[18px] font-semibold">Interview questions</h2>
      <Accordion type="multiple" className="rounded-lg border border-line bg-cream px-4">
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="text-[14px]">{item.q}</AccordionTrigger>
            <AccordionContent className="max-w-[72ch] text-[13.5px] leading-relaxed text-ink-muted">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

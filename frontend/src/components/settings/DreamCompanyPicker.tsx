import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { employerFor } from '@/content/companies'
import { COUNTRIES, DIRECTORY } from '@/content/directory'
import { TIER_LABEL } from '@/content/targets'
import type { Target } from '@/practice/store'
import { CompanyMark } from '@/components/about/CompanyMark'

const MAX_RESULTS = 8

/** Search every company in the directory; picking one sets the dream company and its tier together. */
export function DreamCompanyPicker({ target, onChange }: { target: Target; onChange: (t: Target) => void }) {
  const [query, setQuery] = useState('')
  const dream = employerFor(target)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const starts = DIRECTORY.filter((d) => d.name.toLowerCase().startsWith(q))
    const contains = DIRECTORY.filter((d) => !d.name.toLowerCase().startsWith(q) && d.name.toLowerCase().includes(q))
    return [...starts, ...contains].slice(0, MAX_RESULTS)
  }, [query])

  return (
    <div className="grid gap-2">
      {dream ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-cream px-3 py-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <CompanyMark id={dream.id} name={dream.name} size={22} />
            <span className="truncate text-[13.5px] font-medium">Dream company: {dream.name}</span>
          </span>
          <button
            type="button"
            aria-label="Clear dream company"
            onClick={() => { const { employer: _dropped, ...rest } = target; onChange(rest) }}
            className="grid size-7 place-items-center rounded-md text-ink-muted hover:bg-sand hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="text-[12.5px] text-ink-muted">No dream company yet. Search for one to put it on your card.</p>
      )}
      <Command label="Dream company" shouldFilter={false} className="rounded-md border border-line-strong bg-cream">
        <CommandInput aria-label="Dream company" placeholder="Search 220+ companies, e.g. Google, Flipkart, TCS" value={query} onValueChange={setQuery} />
        {/* Always present, so the input's aria-controls points at something that exists. */}
        <CommandList aria-label="Matching companies" className={query.trim() ? undefined : 'hidden'}>
          {query.trim() && (
            <>
              <CommandEmpty className="px-3 py-2 text-[12.5px] text-ink-muted">No company by that name yet.</CommandEmpty>
              {results.map((c) => (
              <CommandItem
                key={c.id}
                value={c.id}
                onSelect={() => { onChange({ ...target, company: c.tier, employer: c.id }); setQuery('') }}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <CompanyMark id={c.id} name={c.name} size={20} />
                <span className="flex-1 text-[13px]">{c.name}</span>
                <span className="font-mono text-[11px] text-ink-muted">{COUNTRIES[c.country]} · {TIER_LABEL[c.tier]}</span>
              </CommandItem>
              ))}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  )
}

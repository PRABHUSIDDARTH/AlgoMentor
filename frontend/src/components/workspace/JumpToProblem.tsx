import { useState } from 'react'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { statusLine, type HistoryEntry } from '@/lib/history'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  history: HistoryEntry[] | null
  onPick: (entry: HistoryEntry) => void
  onOpenRef: (ref: string) => void
}

export function JumpToProblem({ open, onOpenChange, history, onPick, onOpenRef }: Props) {
  const [query, setQuery] = useState('')
  const number = query.trim().match(/^#?(\d{1,5})$/)?.[1]
  const close = () => {
    onOpenChange(false)
    setQuery('')
  }

  return (
    <CommandDialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())} title="Jump to problem" description="Search recent problems or open a LeetCode number.">
      <CommandInput placeholder="Problem number or recent problem…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No recent problem matches. Type a number to open it from LeetCode.</CommandEmpty>
        {number && (
          <CommandGroup heading="LeetCode">
            <CommandItem value={`open-leetcode-${number}`} onSelect={() => { onOpenRef(number); close() }}>
              Open LeetCode #{number}
            </CommandItem>
          </CommandGroup>
        )}
        {!!history?.length && (
          <CommandGroup heading="Recent">
            {history.map((e) => (
              <CommandItem key={e.key} value={`${e.title} ${e.key}`} onSelect={() => { onPick(e); close() }}>
                <span className="flex-1 truncate">{e.title}</span>
                <span className="font-mono text-[11px] text-ink-muted">{statusLine(e)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

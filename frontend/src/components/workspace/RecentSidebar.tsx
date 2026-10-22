import { Button } from '@/components/ui/button'
import { statusLine, type HistoryEntry } from '@/lib/history'
import { cn } from '@/lib/utils'
import { DifficultyMarker } from './Difficulty'

interface Props {
  history: HistoryEntry[] | null
  activeKey?: string
  onOpen: (entry: HistoryEntry) => void
  onNew: () => void
  className?: string
}

export function RecentSidebar({ history, activeKey, onOpen, onNew, className }: Props) {
  return (
    <aside aria-label="Recent problems" className={cn('grid content-start gap-1 bg-sand px-3 py-4', className)}>
      <h2 className="eyebrow mx-2 mt-1 mb-2">Recent</h2>
      {history === null && <p className="mx-2 text-[12.5px] text-ink-muted">History is off in this browser</p>}
      {history?.length === 0 && <p className="mx-2 text-[12.5px] leading-relaxed text-ink-muted">Problems you open appear here.</p>}
      {history?.map((e) => (
        <button
          key={e.key}
          type="button"
          onClick={() => onOpen(e)}
          aria-current={e.key === activeKey ? 'true' : undefined}
          className={cn(
            'grid gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-cream/60',
            e.key === activeKey && 'bg-cream shadow-[inset_2px_0_0_var(--sage)]',
          )}
        >
          <span className="truncate text-[12.5px] font-medium">{e.title}</span>
          <span className="font-mono text-[10.5px] text-ink-muted">
            <DifficultyMarker difficulty={e.difficulty} />
            {statusLine(e)}
          </span>
        </button>
      ))}
      <Button variant="outline" size="sm" onClick={onNew} className="mx-2 mt-3 border-ink bg-transparent">
        New problem
      </Button>
    </aside>
  )
}

import { Button } from '@/components/ui/button'

/** An error from the request this pane made, with Retry (disabled during a rate-limit cooldown). */
export function InlineError({ message, onRetry, secondsLeft = 0 }: { message: string; onRetry?: () => void; secondsLeft?: number }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-danger/40 px-3.5 py-2.5 text-[12.5px] text-danger">
      <span className="flex-1">{message}</span>
      {secondsLeft > 0 && <span className="font-mono text-[11px]">Try again in {secondsLeft}s</span>}
      {onRetry && (
        <Button size="sm" variant="outline" className="border-danger/50 bg-transparent text-danger hover:bg-danger/10 hover:text-danger" disabled={secondsLeft > 0} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

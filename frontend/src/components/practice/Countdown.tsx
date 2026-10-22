import { useEffect, useState } from 'react'

/** mm:ss on screen; screen readers hear only whole-minute updates. */
export function Countdown({ endsAt, onExpire }: { endsAt: number; onExpire?: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const left = Math.max(0, endsAt - now)
  useEffect(() => {
    if (left === 0) onExpire?.()
  }, [left === 0]) // eslint-disable-line react-hooks/exhaustive-deps
  const mm = Math.floor(left / 60_000)
  const ss = Math.floor((left % 60_000) / 1000)
  const minutes = Math.ceil(left / 60_000)
  return (
    <>
      <span role="timer" aria-label="Time left" className="font-mono text-[15px] font-medium tabular-nums">
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </span>
      <span data-testid="timer-live" aria-live="polite" className="sr-only">
        {left === 0 ? "Time's up" : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`}
      </span>
    </>
  )
}

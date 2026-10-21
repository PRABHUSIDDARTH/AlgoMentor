import { useEffect, useState } from 'react'

/** Whole seconds left until `until` (epoch ms), ticking once a second; 0 when done or unset. */
export function useCountdown(until?: number): number {
  const [now, setNow] = useState(() => Date.now())
  const left = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
  useEffect(() => {
    if (!until || until <= Date.now()) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [until])
  return left
}

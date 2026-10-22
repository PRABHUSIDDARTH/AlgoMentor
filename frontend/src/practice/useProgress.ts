import { useEffect, useState } from 'react'
import { loadProgress, loadUnlocks, PROGRESS_EVENT, type Progress } from './progress'

/** Live roadmap progress and manual unlocks, re-read whenever any page records a change. */
export function useProgress(): { progress: Progress; unlocks: string[] } {
  const [state, setState] = useState(() => ({ progress: loadProgress(), unlocks: loadUnlocks() }))
  useEffect(() => {
    const sync = () => setState({ progress: loadProgress(), unlocks: loadUnlocks() })
    window.addEventListener(PROGRESS_EVENT, sync)
    // Another tab changed storage.
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return state
}

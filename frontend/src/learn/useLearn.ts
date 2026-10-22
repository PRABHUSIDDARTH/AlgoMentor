import { useEffect, useState } from 'react'
import { LEARN_EVENT, loadLearn, type LearnProgress } from './progress'

/** Module progress that follows changes made anywhere in the app (and in other tabs). */
export function useLearn(): LearnProgress {
  const [progress, setProgress] = useState(loadLearn)
  useEffect(() => {
    const refresh = () => setProgress(loadLearn())
    window.addEventListener(LEARN_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(LEARN_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return progress
}

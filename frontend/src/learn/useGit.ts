import { useEffect, useState } from 'react'
import { GIT_EVENT, loadGit, type GitState } from './repos'

/** Linked repositories and check results, following changes made anywhere in the app. */
export function useGit(): GitState {
  const [state, setState] = useState(loadGit)
  useEffect(() => {
    const refresh = () => setState(loadGit())
    window.addEventListener(GIT_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(GIT_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return state
}

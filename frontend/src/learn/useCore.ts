import { useEffect, useState } from 'react'
import { loadSettings, SETTINGS_EVENT } from '@/practice/store'
import { coreGaps, coreReadiness, coreScore, type CoreInput } from './coreReadiness'
import { LEARN_EVENT, loadLearn } from './progress'
import { GIT_EVENT, loadGit } from './repos'

function compute() {
  const input: CoreInput = { learn: loadLearn(), git: loadGit(), target: loadSettings().target }
  const { total, parts } = coreScore(input)
  return { input, total, parts, readiness: coreReadiness(total, input.target), gaps: coreGaps(input) }
}

/** Core CS score, readiness and gaps, recomputed whenever lessons, Git checks or the target change. */
export function useCore() {
  const [state, setState] = useState(compute)
  useEffect(() => {
    const sync = () => setState(compute())
    const events = [LEARN_EVENT, GIT_EVENT, SETTINGS_EVENT, 'storage']
    for (const e of events) window.addEventListener(e, sync)
    return () => {
      for (const e of events) window.removeEventListener(e, sync)
    }
  }, [])
  return state
}

import { useEffect, useState } from 'react'
import type { LeetCodeProfile } from '@/lib/api'
import { loadDays } from './daily'
import { levelFor, levelScore, readiness, topGaps, type LevelInput } from './level'
import { loadProgress, loadReviewLog, loadUnlocks, PROGRESS_EVENT } from './progress'
import { loadSettings, loadStats, SETTINGS_EVENT } from './store'
import { loadTests, scoreTest } from './tests'

function gather(): LevelInput {
  const settings = loadSettings()
  return {
    progress: loadProgress(),
    unlocks: loadUnlocks(),
    target: settings.target,
    tests: Object.values(loadTests()).filter((t) => t.finishedAt).map((t) => ({ score: scoreTest(t).score, finishedAt: t.finishedAt! })),
    days: loadDays(),
    reviewLog: loadReviewLog(),
    leetcode: settings.leetcode ? (loadStats().leetcode?.data as LeetCodeProfile | undefined) : undefined,
    now: Date.now(),
  }
}

function compute() {
  const input = gather()
  const { total, parts } = levelScore(input)
  return { input, total, parts, level: levelFor(total), readiness: readiness(total, input.target), gaps: topGaps(input) }
}

/** Level, readiness and gaps, recomputed whenever progress or settings change. */
export function useLevel() {
  const [state, setState] = useState(compute)
  useEffect(() => {
    const sync = () => setState(compute())
    window.addEventListener(PROGRESS_EVENT, sync)
    window.addEventListener(SETTINGS_EVENT, sync)
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync)
      window.removeEventListener(SETTINGS_EVENT, sync)
    }
  }, [])
  return state
}

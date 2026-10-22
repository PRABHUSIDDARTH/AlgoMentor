import { useCallback, useEffect, useState } from 'react'
import { loadSettings, loadStats, saveSettings, SETTINGS_EVENT, type ProfileSettings } from './store'

/** Settings shared by every page: updates anywhere re-render all users. */
export function useSettings(): [ProfileSettings, (s: ProfileSettings) => void] {
  const [settings, setSettings] = useState(loadSettings)
  useEffect(() => {
    const sync = () => setSettings(loadSettings())
    window.addEventListener(SETTINGS_EVENT, sync)
    return () => window.removeEventListener(SETTINGS_EVENT, sync)
  }, [])
  const update = useCallback((s: ProfileSettings) => saveSettings(s), [])
  return [settings, update]
}

/** Cached profile stats, kept in sync the same way. */
export function useStats() {
  const [stats, setStats] = useState(loadStats)
  useEffect(() => {
    const sync = () => setStats(loadStats())
    window.addEventListener(SETTINGS_EVENT, sync)
    return () => window.removeEventListener(SETTINGS_EVENT, sync)
  }, [])
  return stats
}

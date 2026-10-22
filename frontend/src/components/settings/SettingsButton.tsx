import { Settings } from 'lucide-react'
import { useState } from 'react'
import { SettingsSheet } from './SettingsSheet'

/** The Settings control: fixed top-right on every page, rendered as the last item of each navbar (which reserves room for it). */
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setOpen(true)}
        className="fixed top-3 right-4 z-50 grid size-9 place-items-center rounded-md border border-line-strong bg-cream text-ink shadow-[0_1px_0_var(--line)] hover:border-ink"
      >
        <Settings className="size-4" aria-hidden="true" />
      </button>
      <SettingsSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

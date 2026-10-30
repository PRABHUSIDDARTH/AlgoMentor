import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { clearPhoto, readPhoto, savePhoto, usePhoto } from '@/practice/photo'
import { parseLinkedIn } from '@/practice/profileUrls'
import type { ProfileSettings } from '@/practice/store'

const FIELD = 'rounded-md border border-line-strong bg-grey px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-muted'
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/

/** Name, email and LinkedIn: what goes on the dream ID card and the share link. Stored in this browser only. */
export function IdentityForm({ settings, onSave }: { settings: ProfileSettings; onSave: (s: ProfileSettings) => void }) {
  const [name, setName] = useState(settings.name ?? '')
  const [email, setEmail] = useState(settings.email ?? '')
  const [linkedin, setLinkedin] = useState(settings.linkedin ? `linkedin.com/in/${settings.linkedin}` : '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const photo = usePhoto()
  const [photoNote, setPhotoNote] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    try {
      savePhoto(await readPhoto(file))
      setPhotoNote('Photo added. It stays in this browser.')
    } catch (err) {
      setPhotoNote(null)
      setPhotoError(err instanceof Error ? err.message : "That image couldn't be used.")
    }
  }

  function save(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    const next: ProfileSettings = { ...settings }
    delete next.name
    delete next.email
    delete next.linkedin
    if (name.trim()) {
      if (/[<>{}\n]/.test(name) || name.trim().length > 60) return setError('Use up to 60 characters, without < > { or }.')
      next.name = name.trim()
    }
    if (email.trim()) {
      if (!EMAIL.test(email.trim())) return setError('That email address does not look right.')
      next.email = email.trim()
    }
    if (linkedin.trim()) {
      const parsed = parseLinkedIn(linkedin)
      if ('error' in parsed) return setError(parsed.error)
      next.linkedin = parsed.username
    }
    setError(null)
    onSave(next)
    setSaved(true)
  }

  return (
    <form onSubmit={save} className="grid gap-3 rounded-lg border border-line bg-cream px-4 py-4">
      <div className="grid gap-1.5 text-[12px] text-ink-muted">
        <label htmlFor="card-photo">Photo for your card</label>
        <div className="flex items-center gap-3">
          {photo && <img src={photo} alt="Your card photo" className="size-14 rounded-lg border border-line object-cover" />}
          <input id="card-photo" type="file" accept="image/*" onChange={(e) => void pickPhoto(e)} className="text-[12.5px] text-ink file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-cream file:px-3 file:py-1.5 file:text-[12.5px]" />
          {photo && <Button type="button" size="sm" variant="ghost" onClick={() => { clearPhoto(); setPhotoNote(null) }}>Remove photo</Button>}
        </div>
        {photoNote && <p role="status" className="text-[12px]">{photoNote}</p>}
        {photoError && <p role="alert" className="text-[12px] text-danger">{photoError}</p>}
      </div>
      <label className="grid gap-1 text-[12px] text-ink-muted">
        Name on your card
        <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} maxLength={60} autoComplete="name" placeholder="Your name" className={FIELD} />
      </label>
      <label className="grid gap-1 text-[12px] text-ink-muted">
        Email
        <input type="text" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false) }} autoComplete="email" placeholder="you@example.com" className={FIELD} />
      </label>
      <label className="grid gap-1 text-[12px] text-ink-muted">
        LinkedIn profile URL
        <input value={linkedin} onChange={(e) => { setLinkedin(e.target.value); setSaved(false) }} placeholder="https://www.linkedin.com/in/yourname" className={FIELD} />
      </label>
      <p className="text-[11.5px] leading-relaxed text-ink-muted">
        Your photo is resized here and kept in this browser. Name, email and LinkedIn are kept in this browser too. Your email is only sent anywhere if you add it to a project you contribute. LinkedIn does not let other sites read profiles, so AlgoMentor only links to yours.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" className="bg-ink text-cream hover:bg-ink/90">Save details</Button>
        {saved && <p role="status" className="text-[12px] text-ink-muted">Saved</p>}
      </div>
      {error && <p role="alert" className="text-[12px] text-danger">{error}</p>}
    </form>
  )
}

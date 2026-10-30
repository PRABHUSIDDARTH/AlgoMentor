import { useEffect, useState } from 'react'
import { SETTINGS_EVENT } from './store'

export const PHOTO_KEY = 'algomentor.photo.v1'
const MAX_STORED_CHARS = 600_000
const MAX_SIDE = 480
const MAX_FILE_BYTES = 12 * 1024 * 1024

/** The learner's photo for the card: a small JPEG kept in this browser only. Anything else in storage is ignored. */
export function loadPhoto(): string | null {
  try {
    const v = localStorage.getItem(PHOTO_KEY)
    return v && v.startsWith('data:image/jpeg;base64,') && v.length <= MAX_STORED_CHARS ? v : null
  } catch {
    return null
  }
}

export function savePhoto(dataUrl: string): void {
  try {
    localStorage.setItem(PHOTO_KEY, dataUrl)
  } catch {
    // Storage full or blocked: the card falls back to initials.
  }
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

export function clearPhoto(): void {
  try {
    localStorage.removeItem(PHOTO_KEY)
  } catch {
    // Nothing to clear.
  }
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

/** Size after shrinking the long side to `max`, keeping the shape and never enlarging. */
export function photoSize(w: number, h: number, max: number): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h))
  return { w: Math.round(w * k), h: Math.round(h * k) }
}

/** Reads a chosen image file and returns it as a small JPEG data URL. The file never leaves the browser. */
export async function readPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > MAX_FILE_BYTES) throw new Error('That image is over 12 MB. Choose a smaller one.')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error("That image couldn't be read."))
      i.src = url
    })
    const { w, h } = photoSize(img.naturalWidth, img.naturalHeight, MAX_SIDE)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error("This browser can't resize photos.")
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.86)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function usePhoto(): string | null {
  const [photo, setPhoto] = useState(loadPhoto)
  useEffect(() => {
    const sync = () => setPhoto(loadPhoto())
    window.addEventListener(SETTINGS_EVENT, sync)
    return () => window.removeEventListener(SETTINGS_EVENT, sync)
  }, [])
  return photo
}

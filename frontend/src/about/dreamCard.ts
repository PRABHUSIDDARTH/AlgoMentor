import { employerFor } from '@/content/companies'
import { LOGOS } from '@/content/logos'
import { FOCUS_LABEL, ROLE_LABEL, targetName } from '@/content/targets'
import type { ProfileSettings } from '@/practice/store'

/**
 * The dream ID card: a goal card for the company a learner wants to join. It deliberately says "Dream ID" and "aspiring",
 * carries AlgoMentor's name and a not-affiliated line, and has no employee number or barcode, so it cannot pass as a
 * real company badge.
 */
export type DreamCard = {
  name: string
  company: string
  companyId?: string
  role: string
  focus?: string
  /** The lower of DSA and Core CS readiness, as on Today. */
  readiness: number
  dsa: number
  core: number
  handles: { leetcode?: string; github?: string; linkedin?: string }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function cardData(settings: ProfileSettings, parts: { dsa: number; core: number }): DreamCard {
  const employer = employerFor(settings.target)
  const focus = settings.target.focus && settings.target.focus !== 'general' ? FOCUS_LABEL[settings.target.focus] : undefined
  const handles: DreamCard['handles'] = {}
  if (settings.leetcode) handles.leetcode = settings.leetcode
  if (settings.github) handles.github = settings.github
  if (settings.linkedin) handles.linkedin = settings.linkedin
  return {
    name: settings.name ?? 'Your name',
    company: targetName(settings.target),
    companyId: employer?.id,
    role: ROLE_LABEL[settings.target.role],
    focus,
    readiness: clamp(Math.min(parts.dsa, parts.core)),
    dsa: clamp(parts.dsa),
    core: clamp(parts.core),
    handles,
  }
}

const article = (word: string) => (/^[AEIOU]|^SDE|^S[A-Z]/.test(word) && !/^Senior/.test(word) ? 'an' : 'a')

/** The post text: a goal and the progress toward it, never a claim to work there. */
export function shareText(d: DreamCard): string {
  return [
    `I'm working toward ${article(d.role)} ${d.role} role at ${d.company}${d.focus ? ` (${d.focus})` : ''}.`,
    `AlgoMentor says I'm ${d.readiness}% ready: DSA ${d.dsa}%, core CS ${d.core}%.`,
    'Every problem I solve moves that number. Here is my dream ID to keep me honest.',
    '#AlgoMentor #DreamCompany #CodingInterview',
  ].join('\n\n')
}

/** LinkedIn's post composer with the text filled in. Images cannot be attached by link, so the card is downloaded first. */
export function linkedInShareUrl(text: string): string {
  const url = new URL('https://www.linkedin.com/feed/')
  url.searchParams.set('shareActive', 'true')
  url.searchParams.set('text', text)
  return url.toString()
}

// ---- Drawing ---------------------------------------------------------------------------------------------------

/** The Lanyard draws faces at 1024 wide; its portrait card is 1.6 by 2.25. */
export const FACE = { width: 1024, height: 1440 }

const C = { cream: '#F7F2EB', sand: '#EAE2D6', sage: '#8B9A6E', sageDeep: '#56613F', ink: '#1C2116', muted: '#5B6152', night: '#151A10' }
const SERIF = 'Fraunces, Georgia, serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'
const SANS = 'Inter, system-ui, sans-serif'

function fit(ctx: CanvasRenderingContext2D, text: string, weight: string, size: number, family: string, max: number): number {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > 20 && ctx.measureText(text).width > max) {
    s -= 2
    ctx.font = `${weight} ${s}px ${family}`
  }
  return s
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'center') {
  const chars = [...text]
  const width = chars.reduce((w, ch) => w + ctx.measureText(ch).width + spacing, -spacing)
  let cx = align === 'center' ? x - width / 2 : x
  ctx.textAlign = 'left'
  for (const ch of chars) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > max && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function drawMark(ctx: CanvasRenderingContext2D, d: DreamCard, cx: number, top: number, size: number) {
  const logo = d.companyId ? LOGOS[d.companyId] : undefined
  ctx.fillStyle = logo ? '#FFFFFF' : C.ink
  roundRect(ctx, cx - size / 2, top, size, size, 34)
  ctx.fill()
  ctx.strokeStyle = 'rgba(28,33,22,0.12)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (logo && typeof Path2D !== 'undefined') {
    const inner = size * 0.62
    ctx.save()
    ctx.translate(cx - inner / 2, top + (size - inner) / 2)
    ctx.scale(inner / 24, inner / 24)
    ctx.fillStyle = `#${logo.hex}`
    ctx.fill(new Path2D(logo.path))
    ctx.restore()
    return
  }
  const initials = d.company.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  ctx.fillStyle = C.cream
  ctx.font = `600 ${size * 0.42}px ${SERIF}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, cx, top + size / 2 + 4)
  ctx.textBaseline = 'alphabetic'
}

export function drawFront(canvas: HTMLCanvasElement, d: DreamCard): boolean {
  canvas.width = FACE.width
  canvas.height = FACE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const W = FACE.width
  const cx = W / 2

  ctx.fillStyle = C.cream
  ctx.fillRect(0, 0, W, FACE.height)
  // Top band: the strap clip punches through here, so it stays free of text.
  ctx.fillStyle = C.sand
  ctx.fillRect(0, 0, W, 190)
  ctx.fillStyle = C.sage
  ctx.fillRect(0, 186, W, 8)

  ctx.fillStyle = C.sageDeep
  ctx.font = `600 26px ${MONO}`
  spaced(ctx, 'DREAM ID', cx, 160, 10, 'center')

  drawMark(ctx, d, cx, 236, 220)

  ctx.fillStyle = C.ink
  ctx.textAlign = 'center'
  fit(ctx, d.company, '600', 86, SERIF, W - 140)
  ctx.fillText(d.company, cx, 560)

  ctx.fillStyle = C.sageDeep
  ctx.font = `600 28px ${MONO}`
  spaced(ctx, `ASPIRING ${d.role.toUpperCase()}${d.focus ? ` · ${d.focus.toUpperCase()}` : ''}`, cx, 616, 4, 'center')

  ctx.strokeStyle = 'rgba(28,33,22,0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(96, 668)
  ctx.lineTo(W - 96, 668)
  ctx.stroke()

  ctx.fillStyle = C.ink
  ctx.textAlign = 'left'
  fit(ctx, d.name, '500', 74, SERIF, W - 192)
  ctx.fillText(d.name, 96, 770)

  ctx.fillStyle = C.muted
  ctx.font = `600 24px ${MONO}`
  spaced(ctx, 'READY FOR THIS ROLE', 96, 850, 4, 'left')
  ctx.fillStyle = C.ink
  ctx.font = `600 150px ${SERIF}`
  ctx.textAlign = 'left'
  ctx.fillText(`${d.readiness}%`, 90, 1000)

  const barY = 1036
  ctx.fillStyle = C.sand
  roundRect(ctx, 96, barY, W - 192, 24, 12)
  ctx.fill()
  if (d.readiness > 0) {
    ctx.fillStyle = C.sage
    roundRect(ctx, 96, barY, Math.max(24, ((W - 192) * d.readiness) / 100), 24, 12)
    ctx.fill()
  }
  ctx.fillStyle = C.muted
  ctx.font = `500 26px ${MONO}`
  ctx.fillText(`DSA ${d.dsa}%  ·  CORE CS ${d.core}%`, 96, 1110)

  const handles = [
    d.handles.leetcode && `leetcode.com/u/${d.handles.leetcode}`,
    d.handles.github && `github.com/${d.handles.github}`,
    d.handles.linkedin && `linkedin.com/in/${d.handles.linkedin}`,
  ].filter(Boolean) as string[]
  ctx.fillStyle = C.ink
  ctx.font = `500 26px ${MONO}`
  handles.forEach((h, i) => {
    fit(ctx, h, '500', 26, MONO, W - 192)
    ctx.fillText(h, 96, 1190 + i * 44)
  })

  ctx.fillStyle = C.muted
  ctx.textAlign = 'center'
  ctx.font = `400 20px ${SANS}`
  ctx.fillText(`A goal card from AlgoMentor, not an employee ID. Not affiliated with ${d.company}.`, cx, 1400)
  return true
}

export function drawBack(canvas: HTMLCanvasElement, d: DreamCard, steps: string[]): boolean {
  canvas.width = FACE.width
  canvas.height = FACE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const W = FACE.width
  ctx.fillStyle = C.night
  ctx.fillRect(0, 0, W, FACE.height)
  ctx.fillStyle = C.sage
  ctx.fillRect(0, 186, W, 8)

  ctx.fillStyle = '#A8B68A'
  ctx.font = `600 26px ${MONO}`
  spaced(ctx, `${d.readiness}% THERE`, 96, 300, 6, 'left')

  ctx.fillStyle = C.cream
  ctx.font = `500 72px ${SERIF}`
  ctx.textAlign = 'left'
  wrap(ctx, 'Every problem you solve moves this number.', W - 192).forEach((line, i) => ctx.fillText(line, 96, 400 + i * 88))

  ctx.fillStyle = '#A8B68A'
  ctx.font = `600 24px ${MONO}`
  spaced(ctx, 'NEXT', 96, 760, 6, 'left')
  ctx.fillStyle = C.cream
  ctx.font = `400 34px ${SANS}`
  let y = 820
  for (const step of steps.slice(0, 3)) {
    for (const [i, line] of wrap(ctx, step, W - 240).entries()) {
      if (i === 0) {
        ctx.fillStyle = C.sage
        ctx.beginPath()
        ctx.arc(108, y - 11, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = C.cream
      }
      ctx.fillText(line, 140, y)
      y += 46
    }
    y += 22
  }

  ctx.fillStyle = '#9DA393'
  ctx.textAlign = 'center'
  ctx.font = `500 24px ${MONO}`
  spaced(ctx, 'ALGOMENTOR', W / 2, 1390, 8, 'center')
  return true
}

export function drawStrap(canvas: HTMLCanvasElement, d: DreamCard): boolean {
  canvas.width = 1400
  canvas.height = 112
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.fillStyle = C.ink
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = C.sage
  ctx.fillRect(0, 8, canvas.width, 4)
  ctx.fillRect(0, canvas.height - 12, canvas.width, 4)
  ctx.fillStyle = C.cream
  ctx.font = `600 40px ${MONO}`
  ctx.textBaseline = 'middle'
  spaced(ctx, `ALGOMENTOR · DREAM ${d.company.toUpperCase()} · `, 24, canvas.height / 2 + 2, 6, 'left')
  return true
}

/** Data URLs for the card's front, back and strap, or null where canvas drawing is unavailable. */
export async function cardImages(d: DreamCard, steps: string[]): Promise<{ front: string; back: string; strap: string } | null> {
  try {
    await Promise.all([document.fonts?.load(`600 86px ${SERIF}`), document.fonts?.load(`600 26px ${MONO}`), document.fonts?.load(`400 20px ${SANS}`)])
  } catch {
    // Fall back to the next font in each stack.
  }
  const front = document.createElement('canvas')
  const back = document.createElement('canvas')
  const strap = document.createElement('canvas')
  try {
    if (!drawFront(front, d) || !drawBack(back, d, steps) || !drawStrap(strap, d)) return null
    return { front: front.toDataURL('image/png'), back: back.toDataURL('image/png'), strap: strap.toDataURL('image/png') }
  } catch {
    return null
  }
}

/** A 1200 by 627 PNG for a LinkedIn post: the card on the left, the headline number on the right. */
export async function shareImage(d: DreamCard): Promise<Blob | null> {
  try {
    await Promise.all([document.fonts?.load(`600 86px ${SERIF}`), document.fonts?.load(`600 26px ${MONO}`)])
  } catch {
    // Fall back to the next font in each stack.
  }
  const face = document.createElement('canvas')
  if (!drawFront(face, d)) return null
  const out = document.createElement('canvas')
  out.width = 1200
  out.height = 627
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = C.night
  ctx.fillRect(0, 0, 1200, 627)
  const h = 567
  const w = Math.round((h * FACE.width) / FACE.height)
  ctx.save()
  roundRect(ctx, 48, 30, w, h, 22)
  ctx.clip()
  ctx.drawImage(face, 48, 30, w, h)
  ctx.restore()
  const x = 48 + w + 64
  ctx.textAlign = 'left'
  ctx.fillStyle = '#A8B68A'
  ctx.font = `600 22px ${MONO}`
  spaced(ctx, 'WORKING TOWARD', x, 150, 6, 'left')
  ctx.fillStyle = C.cream
  fit(ctx, d.company, '600', 76, SERIF, 1200 - x - 48)
  ctx.fillText(d.company, x, 240)
  ctx.fillStyle = '#A8B68A'
  ctx.font = `600 22px ${MONO}`
  spaced(ctx, `${d.role.toUpperCase()}${d.focus ? ` · ${d.focus.toUpperCase()}` : ''}`, x, 284, 4, 'left')
  ctx.fillStyle = C.cream
  ctx.font = `600 150px ${SERIF}`
  ctx.fillText(`${d.readiness}%`, x - 6, 450)
  ctx.fillStyle = '#9DA393'
  ctx.font = `500 24px ${MONO}`
  ctx.fillText(`ready · DSA ${d.dsa}% · core CS ${d.core}%`, x, 496)
  ctx.font = `500 20px ${MONO}`
  spaced(ctx, 'ALGOMENTOR', x, 584, 8, 'left')
  return new Promise((resolve) => out.toBlob((b) => resolve(b), 'image/png'))
}

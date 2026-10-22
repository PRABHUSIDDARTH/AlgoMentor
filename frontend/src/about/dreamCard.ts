import { employerFor } from '@/content/companies'
import { OFFICIAL_LOGOS } from '@/content/logos'
import { FOCUS_LABEL, ROLE_LABEL, targetName } from '@/content/targets'
import type { ProfileSettings, Role } from '@/practice/store'

/**
 * The dream ID card: a goal card styled like a company badge (official logo, brand colour, photo, name, role) for the
 * company a learner wants to join. It carries no employee number or barcode, and a small line on the card says it is a
 * goal card and not affiliated with the company, so it cannot pass as a real badge. The readiness figure is never drawn
 * on the card; the page shows it beside the card.
 */
export type DreamCard = {
  name: string
  company: string
  companyId?: string
  /** The company's own logo file in /logos, when AlgoMentor has fetched one from its site. */
  logoFile?: string
  /** Brand colour from the company's own site, or ink. */
  accent: string
  level: Role
  /** "SDE-1" and the like, for the page and the share text. */
  role: string
  /** What the card prints under the name, such as "Software Engineer, Backend". */
  title: string
  focus?: string
  /** The lower of DSA and Core CS readiness, as on Today. */
  readiness: number
  dsa: number
  core: number
  handles: { leetcode?: string; github?: string; linkedin?: string }
}

const TITLES: Record<Role, string> = { intern: 'Software Engineering Intern', sde1: 'Software Engineer', sde2: 'Software Engineer II', sde3: 'Senior Software Engineer' }

/** What a badge for this level and focus would print under the name. */
export function roleTitle(level: Role, focus?: string): string {
  return focus ? `${TITLES[level]}, ${focus}` : TITLES[level]
}

/** First name (printed bold) and the rest (printed light), as company badges often do. */
export function splitName(name: string): { first: string; last: string } {
  const [first = '', ...rest] = name.trim().split(/\s+/)
  return { first, last: rest.join(' ') }
}

const INK = '#1C2116'

/** A brand colour for the card edge, and legible text to put on it. A missing or malformed colour becomes ink. */
export function accentFor(hex?: string | null): { color: string; on: string } {
  let h = (hex ?? '').trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return { color: INK, on: '#FFFFFF' }
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return { color: `#${h.toUpperCase()}`, on: luminance > 0.4 ? '#111111' : '#FFFFFF' }
}

/** Average brightness (0 to 1) of the painted pixels in RGBA data; transparent pixels do not count. Used to spot white logos. */
export function inkLuminance(rgba: Uint8ClampedArray): number {
  let sum = 0
  let weight = 0
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3] / 255
    if (a === 0) continue
    sum += a * (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) / 255
    weight += a
  }
  return weight ? sum / weight : 0
}

/** The largest size that fits inside maxW by maxH and keeps the shape of w by h. */
export function containBox(w: number, h: number, maxW: number, maxH: number): { w: number; h: number } {
  const k = Math.min(maxW / w, maxH / h)
  return { w: Math.round(w * k), h: Math.round(h * k) }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function cardData(settings: ProfileSettings, parts: { dsa: number; core: number }): DreamCard {
  const employer = employerFor(settings.target)
  const focus = settings.target.focus && settings.target.focus !== 'general' ? FOCUS_LABEL[settings.target.focus] : undefined
  const handles: DreamCard['handles'] = {}
  if (settings.leetcode) handles.leetcode = settings.leetcode
  if (settings.github) handles.github = settings.github
  if (settings.linkedin) handles.linkedin = settings.linkedin
  const logo = employer ? OFFICIAL_LOGOS[employer.id] : undefined
  return {
    name: settings.name ?? 'Your name',
    company: targetName(settings.target),
    companyId: employer?.id,
    logoFile: logo?.file,
    accent: accentFor(logo?.primary).color,
    level: settings.target.role,
    role: ROLE_LABEL[settings.target.role],
    title: roleTitle(settings.target.role, focus),
    focus,
    readiness: clamp(Math.min(parts.dsa, parts.core)),
    dsa: clamp(parts.dsa),
    core: clamp(parts.core),
    handles,
  }
}

/** One honest, encouraging line for how far along the learner is. */
export function motivation(readiness: number, company: string): string {
  if (readiness <= 0) return 'Day one. The first solved problem is the hardest one, and it is the one that starts the number moving.'
  if (readiness < 20) return `You have started, and that already puts you ahead of everyone still planning. Keep the streak going toward ${company}.`
  if (readiness < 45) return 'The foundations are going in. This is the stretch where it feels slow and is not, so keep showing up.'
  if (readiness < 70) return `More than halfway to what ${company} looks for. Mix in timed practice and mock interviews now.`
  if (readiness < 90) return 'You are close. Tighten the weak spots, rehearse out loud, and start lining up the application.'
  if (readiness < 100) return `Almost there. What is left is polish: a test run, your stories, and the application to ${company}.`
  return `You have cleared every gap AlgoMentor can measure for ${company}. Apply, and keep one problem a day going until you hear back.`
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

const SERIF = 'Fraunces, Georgia, serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'
const SANS = 'Inter, system-ui, sans-serif'
const MUTED = '#5B6152'

/** Images the card needs, loaded before drawing. Either may be missing. */
export type CardAssets = { logo?: HTMLImageElement | null; photo?: HTMLImageElement | null }

export function loadImage(src: string, timeoutMs = 5000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => resolve(null), timeoutMs)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = src
  })
}

export async function loadAssets(d: DreamCard, photo?: string | null): Promise<CardAssets> {
  const [logo, photoImg] = await Promise.all([d.logoFile ? loadImage(`/logos/${d.logoFile}`) : null, photo ? loadImage(photo) : null])
  return { logo, photo: photoImg }
}

function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, max: number) {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > 18 && ctx.measureText(text).width > max) {
    s -= 2
    ctx.font = `${weight} ${s}px ${family}`
  }
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

function isLightLogo(img: HTMLImageElement, w: number, h: number): boolean {
  try {
    const probe = document.createElement('canvas')
    probe.width = w
    probe.height = h
    const pctx = probe.getContext('2d', { willReadFrequently: true })
    if (!pctx) return false
    pctx.drawImage(img, 0, 0, w, h)
    return inkLuminance(pctx.getImageData(0, 0, w, h).data) > 0.85
  } catch {
    return false
  }
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'
}

function bands(ctx: CanvasRenderingContext2D, d: DreamCard, top: boolean) {
  const { color } = accentFor(d.accent)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, FACE.width, FACE.height)
  ctx.fillStyle = color
  if (top) ctx.fillRect(0, 0, FACE.width, 176)
  else ctx.fillRect(0, 0, FACE.width, 40)
  ctx.fillRect(0, FACE.height - 112, FACE.width, 112)
}

export function drawFront(canvas: HTMLCanvasElement, d: DreamCard, assets: CardAssets = {}): boolean {
  canvas.width = FACE.width
  canvas.height = FACE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const W = FACE.width
  const cx = W / 2
  const { color, on } = accentFor(d.accent)
  bands(ctx, d, true)

  // Company mark: the company's own logo when we have one, otherwise just its name in plain type.
  if (assets.logo) {
    const box = containBox(assets.logo.naturalWidth || assets.logo.width || 1, assets.logo.naturalHeight || assets.logo.height || 1, 620, 130)
    const lx = cx - box.w / 2
    const ly = 246 - box.h / 2 + 20
    // A white logo is invisible on a white card, so it goes on a plate in the brand colour.
    if (isLightLogo(assets.logo, box.w, box.h)) {
      ctx.fillStyle = color
      roundRect(ctx, lx - 36, ly - 22, box.w + 72, box.h + 44, 24)
      ctx.fill()
    }
    ctx.drawImage(assets.logo, lx, ly, box.w, box.h)
  } else {
    ctx.fillStyle = INK
    ctx.textAlign = 'center'
    fitText(ctx, d.company, 700, 84, SANS, W - 200)
    ctx.fillText(d.company, cx, 276)
  }

  // Photo
  const size = 400
  const px = cx - size / 2
  const py = 380
  ctx.save()
  roundRect(ctx, px, py, size, size, 36)
  ctx.clip()
  if (assets.photo) {
    const iw = assets.photo.naturalWidth || assets.photo.width
    const ih = assets.photo.naturalHeight || assets.photo.height
    const k = Math.max(size / iw, size / ih)
    ctx.drawImage(assets.photo, px + (size - iw * k) / 2, py + (size - ih * k) / 2, iw * k, ih * k)
  } else {
    ctx.fillStyle = '#ECE8E0'
    ctx.fillRect(px, py, size, size)
    ctx.fillStyle = '#9A9588'
    ctx.font = `600 170px ${SANS}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials(d.name), cx, py + size / 2 + 8)
    ctx.textBaseline = 'alphabetic'
  }
  ctx.restore()
  ctx.strokeStyle = color
  ctx.lineWidth = 8
  roundRect(ctx, px, py, size, size, 36)
  ctx.stroke()

  // Name: first name heavy, the rest light.
  const { first, last } = splitName(d.name)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  fitText(ctx, first, 700, 92, SANS, W - 140)
  ctx.fillText(first, cx, 920)
  if (last) {
    fitText(ctx, last, 300, 92, SANS, W - 140)
    ctx.fillText(last, cx, 1022)
  }

  // Role, then a short rule in the brand colour.
  ctx.fillStyle = MUTED
  fitText(ctx, d.title, 500, 38, SANS, W - 140)
  ctx.fillText(d.title, cx, 1100)
  ctx.fillStyle = color
  ctx.fillRect(cx - 60, 1140, 120, 8)
  if (assets.logo) {
    ctx.fillStyle = MUTED
    fitText(ctx, d.company, 500, 30, SANS, W - 200)
    ctx.fillText(d.company, cx, 1204)
  }

  ctx.fillStyle = '#7A7F72'
  ctx.font = `400 21px ${SANS}`
  ctx.fillText(`Not affiliated with ${d.company}`, cx, 1318)
  ctx.fillStyle = on
  ctx.font = `600 22px ${MONO}`
  spaced(ctx, 'GOAL CARD · NOT AN EMPLOYEE ID', cx, 1396, 3, 'center')
  return true
}

export function drawBack(canvas: HTMLCanvasElement, d: DreamCard, issued = new Date()): boolean {
  canvas.width = FACE.width
  canvas.height = FACE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const W = FACE.width
  const { color, on } = accentFor(d.accent)
  bands(ctx, d, true)

  ctx.fillStyle = on
  ctx.font = `600 24px ${MONO}`
  spaced(ctx, 'GOAL CARD', W / 2, 108, 8, 'center')

  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  fitText(ctx, d.name, 700, 64, SANS, W - 192)
  ctx.fillText(d.name, 96, 330)
  ctx.fillStyle = MUTED
  fitText(ctx, d.title, 500, 34, SANS, W - 192)
  ctx.fillText(d.title, 96, 384)
  ctx.fillStyle = color
  ctx.fillRect(96, 420, 96, 8)

  const lines = [
    d.handles.leetcode && `leetcode.com/u/${d.handles.leetcode}`,
    d.handles.github && `github.com/${d.handles.github}`,
    d.handles.linkedin && `linkedin.com/in/${d.handles.linkedin}`,
  ].filter(Boolean) as string[]
  ctx.fillStyle = INK
  lines.forEach((h, i) => {
    fitText(ctx, h, 500, 30, MONO, W - 192)
    ctx.fillText(h, 96, 500 + i * 56)
  })

  ctx.fillStyle = MUTED
  ctx.font = `400 28px ${SANS}`
  const note = `This is a personal goal card made in AlgoMentor to keep ${d.company} in sight. It is not an employee ID, and AlgoMentor is not affiliated with ${d.company}.`
  wrap(ctx, note, W - 192).forEach((line, i) => ctx.fillText(line, 96, 800 + i * 42))
  ctx.fillStyle = '#7A7F72'
  ctx.font = `500 24px ${MONO}`
  ctx.fillText(`Set ${issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, 96, 1100)

  ctx.fillStyle = on
  ctx.font = `600 22px ${MONO}`
  spaced(ctx, 'ALGOMENTOR', W / 2, 1396, 8, 'center')
  return true
}

export function drawStrap(canvas: HTMLCanvasElement, d: DreamCard): boolean {
  canvas.width = 1400
  canvas.height = 112
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const { color, on } = accentFor(d.accent)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = on
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 10, canvas.width, 3)
  ctx.fillRect(0, canvas.height - 13, canvas.width, 3)
  ctx.globalAlpha = 1
  ctx.font = `600 40px ${SANS}`
  ctx.textBaseline = 'middle'
  spaced(ctx, `${d.company.toUpperCase()}   ·   `, 24, canvas.height / 2 + 2, 8, 'left')
  return true
}

async function fonts() {
  try {
    await Promise.all([document.fonts?.load(`700 92px ${SANS}`), document.fonts?.load(`300 92px ${SANS}`), document.fonts?.load(`600 22px ${MONO}`)])
  } catch {
    // Fall back to the next font in each stack.
  }
}

/** Data URLs for the card's front, back and strap, or null where canvas drawing is unavailable. */
export async function cardImages(d: DreamCard, photo?: string | null): Promise<{ front: string; back: string; strap: string } | null> {
  await fonts()
  const assets = await loadAssets(d, photo)
  const front = document.createElement('canvas')
  const back = document.createElement('canvas')
  const strap = document.createElement('canvas')
  try {
    if (!drawFront(front, d, assets) || !drawBack(back, d) || !drawStrap(strap, d)) return null
    return { front: front.toDataURL('image/png'), back: back.toDataURL('image/png'), strap: strap.toDataURL('image/png') }
  } catch {
    return null
  }
}

/** A 1200 by 627 PNG for a LinkedIn post: the card on the left, the headline number beside it (never on the card). */
export async function shareImage(d: DreamCard, photo?: string | null): Promise<Blob | null> {
  await fonts()
  const face = document.createElement('canvas')
  if (!drawFront(face, d, await loadAssets(d, photo))) return null
  const out = document.createElement('canvas')
  out.width = 1200
  out.height = 627
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#151A10'
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
  ctx.fillStyle = '#F7F2EB'
  fitText(ctx, d.company, 600, 76, SANS, 1200 - x - 48)
  ctx.fillText(d.company, x, 240)
  ctx.fillStyle = '#A8B68A'
  ctx.font = `600 22px ${MONO}`
  spaced(ctx, `${d.role.toUpperCase()}${d.focus ? ` · ${d.focus.toUpperCase()}` : ''}`, x, 284, 4, 'left')
  ctx.fillStyle = '#F7F2EB'
  ctx.font = `600 150px ${SERIF}`
  ctx.fillText(`${d.readiness}%`, x - 6, 450)
  ctx.fillStyle = '#9DA393'
  ctx.font = `500 24px ${MONO}`
  ctx.fillText(`ready · DSA ${d.dsa}% · core CS ${d.core}%`, x, 496)
  ctx.font = `500 20px ${MONO}`
  spaced(ctx, 'ALGOMENTOR', x, 584, 8, 'left')
  return new Promise((resolve) => out.toBlob((b) => resolve(b), 'image/png'))
}

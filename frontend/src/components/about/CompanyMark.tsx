import { LOGOS } from '@/content/logos'

/** A company's Simple Icons logo in its brand colour, or a monogram tile when there is none. Decorative: the name is always shown beside it. */
export function CompanyMark({ id, name, size = 24 }: { id: string; name: string; size?: number }) {
  const logo = LOGOS[id]
  if (logo) {
    // On a white tile so dark brand colours stay visible in the dark theme.
    return (
      <span aria-hidden="true" style={{ width: size, height: size, padding: Math.round(size * 0.14) }} className="grid shrink-0 place-items-center rounded-[5px] bg-white">
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill={`#${logo.hex}`}>
          <path d={logo.path} />
        </svg>
      </span>
    )
  }
  return (
    <span aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.48 }} className="grid shrink-0 place-items-center rounded-[5px] bg-ink font-semibold text-cream">
      {monogram(name)}
    </span>
  )
}

/** Up to two initials: "Tata Consultancy Services" becomes "TC", "Zoho" becomes "Z". */
export function monogram(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'
}

import { OFFICIAL_LOGOS } from '@/content/logos'

/**
 * A company's own logo, taken from its website, on a white tile so it reads in either theme. A company without an
 * official logo gets nothing: its name is always printed beside the mark, and an invented stand-in would be worse than none.
 */
export function CompanyMark({ id, size = 24 }: { id: string; name?: string; size?: number }) {
  const logo = OFFICIAL_LOGOS[id]
  if (!logo) return null
  return (
    <span aria-hidden="true" style={{ width: size, height: size, padding: Math.round(size * 0.12) }} className={`grid shrink-0 place-items-center rounded-[5px] border border-line ${logo.onDark ? 'bg-[#1C2116]' : 'bg-white'}`}>
      <img src={`/logos/${logo.file}`} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
    </span>
  )
}

/** A 1–3 segment marker: one filled for Easy, two for Medium, three for Hard. */
export function DifficultyMarker({ difficulty }: { difficulty?: string }) {
  const level = { easy: 1, medium: 2, hard: 3 }[(difficulty ?? '').toLowerCase()] ?? 0
  if (!level) return null
  return (
    <span className="mr-1.5 inline-flex gap-0.5 align-[1px]" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <i key={i} className={`size-[5px] rounded-[1px] bg-ink ${i <= level ? '' : 'opacity-20'}`} />
      ))}
    </span>
  )
}

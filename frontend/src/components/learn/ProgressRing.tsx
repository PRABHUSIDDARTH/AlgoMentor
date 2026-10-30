/** A circular progress mark with the count in the middle; described in words for assistive tech. */
export function ProgressRing({ done, total, label, size = 64 }: { done: number; total: number; label: string; size?: number }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${done} of ${total} modules complete`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        data-part="arc"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--sage)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 400ms ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontSize={size * 0.22}>{done}/{total}</text>
    </svg>
  )
}

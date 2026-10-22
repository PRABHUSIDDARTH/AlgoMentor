import type { ReactNode, SVGProps } from 'react'

/** Shared drawing kit: every diagram uses palette tokens so it follows the light and dark themes. */
export const ink = { fill: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 13 } as const
export const muted = { fill: 'var(--ink-muted)', fontFamily: 'var(--font-sans)', fontSize: 12 } as const
export const line = { stroke: 'var(--line-strong)', strokeWidth: 1.5, fill: 'none' } as const
export const accent = { stroke: 'var(--sage)', strokeWidth: 1.5, fill: 'none' } as const

export function Svg({ label, viewBox, children }: { label: string; viewBox: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className="h-auto w-full">
      {children}
    </svg>
  )
}

/** A UML-style class box: name, then optional rows of members. */
export function ClassBox({ x, y, w, title, rows = [], stereotype, ...rest }: { x: number; y: number; w: number; title: string; rows?: string[]; stereotype?: string } & SVGProps<SVGGElement>) {
  const head = stereotype ? 44 : 30
  const h = head + rows.length * 20 + (rows.length ? 10 : 0)
  return (
    <g {...rest}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill="var(--sand)" stroke="var(--line-strong)" strokeWidth={1.5} />
      {stereotype && <text x={x + w / 2} y={y + 17} textAnchor="middle" {...muted}>{`<<${stereotype}>>`}</text>}
      <text x={x + w / 2} y={y + head - 10} textAnchor="middle" {...ink} fontWeight={700}>{title}</text>
      {rows.length > 0 && <line x1={x} y1={y + head} x2={x + w} y2={y + head} stroke="var(--line-strong)" />}
      {rows.map((r, i) => <text key={i} x={x + 10} y={y + head + 20 + i * 20} {...ink} fontSize={12}>{r}</text>)}
    </g>
  )
}

/** Arrowhead and diamond markers, defined once per diagram. */
export function Markers({ id }: { id: string }) {
  return (
    <defs>
      <marker id={`${id}-tri`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
        <path d="M1 1 L11 6 L1 11 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.2" />
      </marker>
      <marker id={`${id}-open`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
        <path d="M1 1 L11 6 L1 11" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
      </marker>
      <marker id={`${id}-dia`} viewBox="0 0 16 10" refX="1" refY="5" markerWidth="16" markerHeight="10" orient="auto-start-reverse">
        <path d="M1 5 L8 1 L15 5 L8 9 Z" fill="var(--ink)" stroke="var(--ink)" strokeWidth="1" />
      </marker>
      <marker id={`${id}-hdia`} viewBox="0 0 16 10" refX="1" refY="5" markerWidth="16" markerHeight="10" orient="auto-start-reverse">
        <path d="M1 5 L8 1 L15 5 L8 9 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1" />
      </marker>
    </defs>
  )
}

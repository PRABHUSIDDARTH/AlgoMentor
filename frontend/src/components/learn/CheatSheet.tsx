import { useId } from 'react'

/** Static command reference for one challenge. It explains commands; it never runs or suggests code. */
export function CheatSheet({ rows }: { rows: { command: string; what: string }[] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <h2 id={id} className="text-[18px] font-semibold">Commands that help</h2>
      <div className="overflow-x-auto rounded-lg border border-line bg-cream">
        <table aria-label="Commands for this challenge" className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-line bg-sand text-[11.5px] uppercase tracking-wide text-ink-muted">
              <th scope="col" className="px-4 py-2 font-medium">Command</th>
              <th scope="col" className="px-4 py-2 font-medium">What it does</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.command} className="border-b border-line align-top last:border-b-0">
                <td className="px-4 py-2.5 font-mono text-[12px] break-words">{r.command}</td>
                <td className="px-4 py-2.5 leading-snug text-ink-muted">{r.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

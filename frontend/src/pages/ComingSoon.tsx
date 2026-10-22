import { AppShell } from '@/components/AppShell'

/** Placeholder for pages being built (Practice hub tasks 5–8, Learning hub). */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell>
      <div className="grid content-start gap-2 px-6 py-10 sm:px-10 lg:px-14">
        <h1 className="display text-[30px]">{title}</h1>
        <p className="text-[14px] text-ink-muted">This page is being built.</p>
      </div>
    </AppShell>
  )
}

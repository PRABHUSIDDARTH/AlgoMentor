import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useNavActions, useNavHost } from '@/components/nav/NavHost'
import { SiteNav } from '@/components/nav/SiteNav'
import { EmptyState } from '@/components/workspace/EmptyState'
import { JumpToProblem } from '@/components/workspace/JumpToProblem'
import { MentorPanel } from '@/components/workspace/MentorPanel'
import { ProblemPane } from '@/components/workspace/ProblemPane'
import { RecentSidebar } from '@/components/workspace/RecentSidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { PROBLEMS } from '@/content/roadmap'
import { useMentorSession } from '@/state/useMentorSession'

export default function Workspace() {
  const session = useMentorSession()
  const [params, setParams] = useSearchParams()
  const [jumpOpen, setJumpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const handledQuery = useRef<string | null>(null)
  const host = useNavHost()
  useNavActions({ onJump: () => setJumpOpen(true), onMenu: () => setMenuOpen(true) })

  // Reacts to ?q= changes too (e.g. the landing page or a link), not only on first load.
  const q = params.get('q')
  const from = params.get('from') ?? undefined
  useEffect(() => {
    if (q && q !== handledQuery.current) {
      handledQuery.current = q
      void session.openProblem(q, { roadmapProblemId: from && PROBLEMS.has(from) ? from : undefined })
    }
  }, [q, from, session.openProblem])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setJumpOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const startNew = () => {
    handledQuery.current = null
    setParams({})
    session.reset()
    setMenuOpen(false)
  }

  const sidebar = (className?: string) => (
    <RecentSidebar
      history={session.history}
      activeKey={session.problem?.key}
      onOpen={(e) => { void session.openEntry(e); setMenuOpen(false) }}
      onNew={startNew}
      className={className}
    />
  )

  const problemError = session.error?.tab === 'problem' ? session.error.message : undefined

  const content = (
    <>
      <div className="grid min-h-0 flex-1 min-[1200px]:grid-cols-[220px_minmax(0,1fr)]">
        {sidebar('hidden overflow-y-auto border-r border-line min-[1200px]:grid')}
        <main id="main" className="min-h-0 min-w-0 md:overflow-hidden">
          {session.problem ? (
            <div className="grid h-full md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
              <div data-testid="problem-scroll" className="border-b border-line md:min-h-0 md:overflow-y-auto md:border-r md:border-b-0">
                {problemError && <p role="alert" className="mx-6 mt-4 rounded-md border border-danger/40 px-3 py-2 text-[12.5px] text-danger">{problemError}</p>}
                <ProblemPane key={session.problem.key + session.problem.statement.length} problem={session.problem} onEdit={session.editStatement} />
              </div>
              <div data-testid="mentor-scroll" className="bg-sand md:min-h-0 md:overflow-y-auto"><MentorPanel key={session.problem.key} session={session} /></div>
            </div>
          ) : session.status === 'loadingProblem' ? (
            <p className="px-6 py-10 text-[13px] text-ink-muted" role="status">Fetching the problem from LeetCode…</p>
          ) : (
            <div className="h-full overflow-y-auto"><EmptyState onStart={(v) => void session.openProblem(v)} error={problemError} /></div>
          )}
        </main>
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[260px] bg-sand p-0 text-ink">
          <SheetTitle className="sr-only">Recent problems</SheetTitle>
          {sidebar('pt-10')}
        </SheetContent>
      </Sheet>
      <JumpToProblem
        open={jumpOpen}
        onOpenChange={setJumpOpen}
        history={session.history}
        onPick={(e) => void session.openEntry(e)}
        onOpenRef={(ref) => void session.openProblem(ref)}
      />
    </>
  )
  // The navbar and page frame come from RootLayout when there is one.
  if (host) return content
  return (
    <div data-testid="workspace-shell" className="flex min-h-dvh flex-col bg-cream md:h-dvh md:overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <SiteNav onJump={() => setJumpOpen(true)} onMenu={() => setMenuOpen(true)} />
      {content}
    </div>
  )
}

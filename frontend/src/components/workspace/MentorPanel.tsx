import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCountdown } from '@/hooks/useCountdown'
import { MAX_HINTS, type MentorSession, type Tab } from '@/state/useMentorSession'
import { AnswerView } from './AnswerView'
import { FollowUp } from './FollowUp'
import { HintCard } from './HintCard'
import { HintStepper } from './HintStepper'
import { InlineError } from './InlineError'
import { RevealDialog } from './RevealDialog'

const primary = 'bg-sage font-semibold text-on-sage hover:bg-sage/90'
const READY: Record<Tab, string> = { explain: 'Explanation ready', hints: 'Hint ready', solution: 'Solution ready' }

/** Live-region text: empty while streaming, a short "ready" note when an answer finishes. */
function useAnnouncement(s: MentorSession): string {
  const [message, setMessage] = useState('')
  const previous = useRef(s.streaming)
  useEffect(() => {
    const was = previous.current
    previous.current = s.streaming
    if (s.streaming) setMessage('')
    else if (was && !s.error) {
      setMessage(was.followup ? 'Answer ready' : was.tab === 'hints' ? `Hint ${s.hints.length} ready` : READY[was.tab])
    }
  }, [s.streaming, s.error, s.hints.length])
  return message
}

export function MentorPanel({ session: s }: { session: MentorSession }) {
  const [confirming, setConfirming] = useState(false)
  const secondsLeft = useCountdown(s.cooldownUntil)
  const announcement = useAnnouncement(s)
  const busy = s.status === 'streaming'
  const blocked = busy || secondsLeft > 0
  const tabStream = s.streaming && !s.streaming.followup ? s.streaming : null
  const followStream = s.streaming?.followup ? s.streaming.text : undefined

  const lastToast = useRef<unknown>(null)
  useEffect(() => {
    if (s.error?.network && lastToast.current !== s.error) {
      lastToast.current = s.error
      toast.error('Connection problem', { description: s.error.message })
    }
  }, [s.error])

  const tabError = s.error && !s.error.followup && s.error.tab !== 'problem' && s.error.tab === s.tab ? s.error : undefined
  const errorBox = (e: NonNullable<MentorSession['error']>) => (
    <>
      {e.partial && <AnswerView markdown={e.partial} className="opacity-80" />}
      <InlineError message={e.message} onRetry={s.retry} secondsLeft={secondsLeft} />
    </>
  )

  // The dialog opens from whichever Reveal button was used; focus goes back there on close.
  const opener = useRef<HTMLElement | null>(null)

  function reveal() {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (s.hintsRemaining > 0 && !s.solutionRevealed) setConfirming(true)
    else s.revealSolution()
  }

  const writingIndex = tabStream?.tab === 'hints' ? s.hints.length : null

  return (
    <section aria-label="Mentor" className="grid content-start gap-4 px-5 py-4 md:px-6">
      <p data-testid="mentor-live" aria-live="polite" className="sr-only">{announcement}</p>
      <Tabs value={s.tab} onValueChange={(v) => s.setTab(v as Tab)} className="gap-4">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-line bg-transparent p-0">
          {(['explain', 'hints', 'solution'] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="flex-none rounded-none border-0 bg-transparent px-0 pt-1.5 pb-2.5 text-[13px] font-medium text-ink-muted shadow-none data-[state=active]:border-transparent! data-[state=active]:bg-transparent! data-[state=active]:text-ink data-[state=active]:shadow-[inset_0_-2px_0_var(--ink)]!"
            >
              {t === 'explain' ? 'Explain' : t === 'hints' ? 'Hints' : 'Solution'}
              {t === 'hints' && <span className="ml-1.5 font-mono text-[10.5px] text-ink-muted">{s.hints.length} / {MAX_HINTS}</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="explain" className="grid gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ink">
          {s.explain || tabStream?.tab === 'explain' ? (
            <AnswerView markdown={tabStream?.tab === 'explain' ? tabStream.text : s.explain!} streaming={tabStream?.tab === 'explain'} />
          ) : (
            <div className="grid justify-items-start gap-3">
              <p className="text-[13px] leading-relaxed text-ink-muted">Get the intuition behind the problem: what it is really asking and which ideas apply, without the full solution.</p>
              <Button className={primary} disabled={blocked} onClick={s.explainProblem}>Explain the problem</Button>
            </div>
          )}
          {tabError && errorBox(tabError)}
        </TabsContent>

        <TabsContent value="hints" className="grid gap-3.5 rounded-md focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ink">
          <HintStepper
            seen={s.hints.length}
            current={writingIndex}
            revealed={s.solutionRevealed}
            onSelect={(i) => document.getElementById(`hint-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          />
          {s.hints.length === 0 && !tabStream && (
            <p className="text-[13px] leading-relaxed text-ink-muted">Hints start vague and get more specific. Take a moment to think after each one.</p>
          )}
          {s.hints.map((h, i) => (
            <HintCard key={i} index={i} text={h} state={i === s.hints.length - 1 && !tabStream ? 'latest' : 'past'} />
          ))}
          {tabStream?.tab === 'hints' && <HintCard index={s.hints.length} text={tabStream.text} state="writing" />}
          {tabError && errorBox(tabError)}
          <div className="flex flex-wrap items-center gap-2">
            <Button className={primary} disabled={blocked || s.hints.length >= MAX_HINTS} onClick={s.nextHint}>Next hint</Button>
            <Button variant="outline" className="border-ink bg-transparent" disabled={s.solved} onClick={s.markSolved}>
              {s.solved ? 'Marked as solved' : 'I solved it'}
            </Button>
            <span className="flex-1" />
            <Button variant="link" className="px-1 font-medium text-ink underline underline-offset-[3px]" disabled={busy} onClick={reveal}>
              Reveal solution
            </Button>
          </div>
          {s.hints.length > 0 && s.hintsRemaining > 0 && !s.solutionRevealed && (
            <p className="text-[11.5px] text-ink-muted">
              Revealing the solution now skips {s.hintsRemaining} {s.hintsRemaining === 1 ? 'hint' : 'hints'}. You can still come back to them.
            </p>
          )}
        </TabsContent>

        <TabsContent value="solution" className="grid gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ink">
          {!s.solutionRevealed ? (
            <div className="grid justify-items-start gap-3">
              <p className="text-[13px] leading-relaxed text-ink-muted">The solution stays hidden until you ask for it. Try the hints first; you will remember the pattern better.</p>
              <Button className={primary} disabled={blocked} onClick={reveal}>Reveal solution</Button>
            </div>
          ) : tabStream?.tab === 'solution' || s.solution[s.language] ? (
            <AnswerView
              markdown={tabStream?.tab === 'solution' ? tabStream.text : s.solution[s.language]!}
              streaming={tabStream?.tab === 'solution'}
              language={s.language}
              onLanguage={s.setLanguage}
            />
          ) : null}
          {tabError && errorBox(tabError)}
        </TabsContent>
      </Tabs>

      <FollowUp turns={s.followups} streamingText={followStream} disabled={blocked} onAsk={s.askFollowUp} />
      {s.error?.followup && <InlineError message={s.error.message} onRetry={s.retry} secondsLeft={secondsLeft} />}

      <RevealDialog
        open={confirming}
        hintsLeft={s.hintsRemaining}
        onOpenChange={setConfirming}
        onConfirm={() => { setConfirming(false); s.revealSolution() }}
        returnFocus={() => opener.current?.focus()}
      />
    </section>
  )
}

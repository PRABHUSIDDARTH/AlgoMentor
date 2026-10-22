import { Settings as Gear } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { cardData, linkedInShareUrl, motivation, shareImage, shareText } from '@/about/dreamCard'
import { AppShell } from '@/components/AppShell'
import { CompanyMark } from '@/components/about/CompanyMark'
import { DreamLanyard } from '@/components/about/DreamLanyard'
import { PageHeader } from '@/components/PageHeader'
import { ReadinessMeter } from '@/components/practice/ReadinessMeter'
import { statsLine } from '@/components/settings/ProfileCard'
import { Button } from '@/components/ui/button'
import { employerFor } from '@/content/companies'
import { ROLE_LABEL, targetName } from '@/content/targets'
import { useCore } from '@/learn/useCore'
import { useLiveProfiles } from '@/practice/liveProfiles'
import { SITE_NAMES, type Site } from '@/practice/profileUrls'
import { useLevel } from '@/practice/useLevel'
import { useSettings, useStats } from '@/practice/useSettings'

const PROFILE_URL: Record<Site, (u: string) => string> = {
  leetcode: (u) => `leetcode.com/u/${u}`,
  hackerrank: (u) => `hackerrank.com/profile/${u}`,
  gfg: (u) => `geeksforgeeks.org/user/${u}`,
  github: (u) => `github.com/${u}`,
}
const SITES: Site[] = ['leetcode', 'hackerrank', 'gfg', 'github']

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Who you are, where you are headed, and how close you are: the dream ID card, your readiness for that company, and your live profiles. */
export default function About() {
  const [settings] = useSettings()
  const stats = useStats()
  const level = useLevel()
  const core = useCore()
  const { refreshing, refreshAll } = useLiveProfiles()
  const [note, setNote] = useState<string | null>(null)

  const dream = employerFor(settings.target)
  const card = useMemo(() => cardData(settings, { dsa: level.readiness, core: core.readiness }), [settings, level.readiness, core.readiness])
  const steps = useMemo(() => [...level.gaps.map((g) => g.action), ...core.gaps.map((g) => g.action)].slice(0, 4), [level.gaps, core.gaps])
  const name = targetName(settings.target)

  async function share() {
    // Opened first, inside the click, so a popup blocker allows it; the image is drawn while LinkedIn loads.
    window.open(linkedInShareUrl(shareText(card)), '_blank', 'noopener,noreferrer')
    const image = await shareImage(card)
    if (image) download(image, 'my-dream-id.png')
    setNote(image
      ? 'LinkedIn is open with your post filled in. Attach my-dream-id.png, which just downloaded, then post.'
      : 'LinkedIn is open with your post filled in. Your browser could not draw the card image, so attach a screenshot of the card.')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText(card))
      setNote('Post text copied.')
    } catch {
      setNote('Your browser blocked copying. Select the text in the LinkedIn composer instead.')
    }
  }

  async function save() {
    const image = await shareImage(card)
    if (image) download(image, 'my-dream-id.png')
    else setNote('Your browser could not draw the card image.')
  }

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-8 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader eyebrow="About" title="About you" summary="Your dream company on a card you can hang on the wall, and a number that says how close you are to it.">
          <div className="pt-1">
            <Button asChild variant="outline" size="sm" className="border-ink bg-transparent">
              <Link to="/about/settings" aria-label="Edit profile settings"><Gear className="size-4" aria-hidden="true" />Settings</Link>
            </Button>
          </div>
        </PageHeader>

        {!dream && (
          <section aria-labelledby="ab-pick" className="grid max-w-[72ch] gap-3 rounded-lg border border-line bg-sand px-6 py-6">
            <h2 id="ab-pick" className="text-[20px] font-semibold">Pick the company you want to walk into</h2>
            <p className="text-[14px] leading-relaxed">Choose a dream company from over 200 across India, the US, Europe, Asia and beyond, and AlgoMentor turns it into a card and a readiness number for the role you want there.</p>
            <Link to="/about/settings" className="justify-self-start rounded-md bg-sage px-4 py-2 text-[13.5px] font-semibold text-on-sage hover:bg-sage/90">Choose your dream company</Link>
          </section>
        )}

        {dream && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <section aria-label="Your dream ID" className="grid content-start gap-3">
              <DreamLanyard card={card} steps={steps} />
              <p className="text-[12px] leading-relaxed text-ink-muted">A goal card made by AlgoMentor, not an employee ID. AlgoMentor is not affiliated with {dream.name}, and its logo belongs to its owner.</p>
            </section>

            <div className="grid content-start gap-6">
              <section aria-labelledby="ab-ready" className="grid gap-3 rounded-lg border border-line bg-cream px-5 py-5">
                <div className="flex items-center gap-3">
                  <CompanyMark id={dream.id} name={dream.name} size={32} />
                  <div>
                    <h2 id="ab-ready" className="text-[18px] font-semibold">You are {card.readiness}% ready for {dream.name}</h2>
                    <p className="font-mono text-[11.5px] text-ink-muted">{ROLE_LABEL[settings.target.role]}{card.focus ? ` · ${card.focus}` : ''}</p>
                  </div>
                </div>
                <ReadinessMeter value={card.readiness} label={`Readiness for ${name} ${ROLE_LABEL[settings.target.role]}`} />
                <p className="text-[14px] leading-relaxed">{motivation(card.readiness, dream.name)}</p>
                <p className="font-mono text-[12px] text-ink-muted">DSA {card.dsa}% · Core CS {card.core}%. The lower of the two, because interviews test both.</p>
                {dream.profile ? (
                  <Link to={`/companies/${dream.id}`} className="justify-self-start text-[13px] underline underline-offset-[3px]">How {dream.name} hires, round by round</Link>
                ) : (
                  <p className="text-[12.5px] text-ink-muted">AlgoMentor has not checked how {dream.name} hires yet, so this uses the weights for its tier.</p>
                )}
              </section>

              <section aria-labelledby="ab-next" className="grid gap-2">
                <h2 id="ab-next" className="text-[16px] font-semibold">What moves the number next</h2>
                <ol aria-label="Next steps" className="grid gap-1.5 pl-5 text-[13.5px] leading-relaxed [&>li]:list-decimal [&>li]:marker:text-ink-muted">
                  {steps.length ? steps.map((s) => <li key={s}>{s}</li>) : <li>You have cleared every gap AlgoMentor can see. Book the interview.</li>}
                </ol>
              </section>

              <section aria-labelledby="ab-share" className="grid gap-2.5">
                <h2 id="ab-share" className="text-[16px] font-semibold">Share it</h2>
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-ink text-cream hover:bg-ink/90" onClick={() => void share()}>Share on LinkedIn</Button>
                  <Button variant="outline" className="border-ink bg-transparent" onClick={() => void save()}>Download card</Button>
                  <Button variant="outline" className="border-ink bg-transparent" onClick={() => void copy()}>Copy post text</Button>
                </div>
                <p className="text-[12px] leading-relaxed text-ink-muted">LinkedIn does not let other sites attach pictures to a post, so the card downloads and LinkedIn opens with the words filled in. The post says you are working toward the role, never that you have it.</p>
                {note && <p role="status" className="text-[12.5px]">{note}</p>}
              </section>
            </div>
          </div>
        )}

        <section aria-labelledby="ab-profiles" className="grid gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="ab-profiles" className="text-[18px] font-semibold">Your profiles, live</h2>
            <button type="button" onClick={refreshAll} disabled={refreshing.length > 0} className="text-[13px] underline underline-offset-[3px] disabled:opacity-50">
              {refreshing.length ? 'Reading profiles…' : 'Refresh all now'}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SITES.map((site) => {
              const user = settings[site]
              return (
                <section key={site} aria-label={SITE_NAMES[site]} className="grid content-start gap-1.5 rounded-lg border border-line bg-cream px-4 py-3.5">
                  <h3 className="font-mono text-[13px] font-semibold">{SITE_NAMES[site]}</h3>
                  {user ? (
                    <>
                      <a href={`https://${PROFILE_URL[site](user)}`} target="_blank" rel="noreferrer" className="truncate font-mono text-[11.5px] text-ink-muted underline underline-offset-[3px]">{PROFILE_URL[site](user)}<span className="sr-only"> (opens in a new tab)</span></a>
                      {stats[site] ? statsLine(site, stats[site]!.data).map((l) => <p key={l} className="text-[12.5px]">{l}</p>) : <p className="text-[12.5px] text-ink-muted">Reading…</p>}
                    </>
                  ) : (
                    <Link to="/about/settings" className="text-[12.5px] underline underline-offset-[3px]">Connect {SITE_NAMES[site]}</Link>
                  )}
                </section>
              )
            })}
            <section aria-label="LinkedIn" className="grid content-start gap-1.5 rounded-lg border border-line bg-cream px-4 py-3.5">
              <h3 className="font-mono text-[13px] font-semibold">LinkedIn</h3>
              {settings.linkedin ? (
                <>
                  <a href={`https://www.linkedin.com/in/${settings.linkedin}`} target="_blank" rel="noreferrer" className="truncate font-mono text-[11.5px] text-ink-muted underline underline-offset-[3px]">linkedin.com/in/{settings.linkedin}<span className="sr-only"> (opens in a new tab)</span></a>
                  <p className="text-[12.5px] text-ink-muted">LinkedIn does not allow reading profiles, so this is a link only.</p>
                </>
              ) : (
                <Link to="/about/settings" className="text-[12.5px] underline underline-offset-[3px]">Add your LinkedIn</Link>
              )}
            </section>
          </div>
          <p className="text-[11.5px] text-ink-muted">Stats are read again every ten minutes while this page is open, and when you come back to the tab.</p>
        </section>
      </div>
    </AppShell>
  )
}

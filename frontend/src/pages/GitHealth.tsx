import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { RepoHealth } from '@/components/learn/RepoHealth'
import { PRACTICE_SCOPE } from '@/learn/repos'

/** The "make your GitHub shine" check on its own, for the repository linked on the Git page. */
export default function GitHealth() {
  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-7 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <PageHeader
          eyebrow="Git"
          title="Repository health"
          summary="What a recruiter sees first: a README, a license, a sensible .gitignore, a readable history. Checks use GitHub's public data, so the repository must be public."
        />
        <section aria-label="Check a repository" className="max-w-[760px] rounded-lg border border-line bg-sand px-5 py-5">
          <RepoHealth scope={PRACTICE_SCOPE} />
        </section>
      </div>
    </AppShell>
  )
}

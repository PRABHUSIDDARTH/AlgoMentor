import { Link } from 'react-router'
import { ProblemStartForm } from '@/components/ProblemStartForm'
import { DataStructureScene } from './DataStructureScene'
import { Headline } from './Headline'

const TRY = [
  { q: '1', label: '1. Two Sum' },
  { q: '146', label: '146. LRU Cache' },
  { q: '200', label: '200. Number of Islands' },
]


export function Hero() {
  return (
    <section id="top" className="grid min-h-[calc(100svh-62px)] overflow-x-clip scroll-mt-20 items-center gap-8 px-6 sm:px-10 lg:px-16 xl:px-24 pt-10 pb-12 lg:grid-cols-[1fr_1.1fr] xl:gap-16">
      <div>
        <p className="eyebrow">AI mentor for data structures &amp; algorithms</p>
        <Headline text="Understand the problem before you see the answer." highlight="before" />
        <p className="max-w-[440px] text-[15px] leading-[1.65] text-ink-muted">
          AlgoMentor gives you one hint at a time, explains the intuition, and only then walks through the optimal solution
          and its complexity. Bring any LeetCode problem by number.
        </p>
        <ProblemStartForm className="mt-7" />
        <p className="mt-3 text-[12.5px] text-ink-muted">
          Try{' '}
          {TRY.map((t) => (
            <Link key={t.q} to={`/app?q=${t.q}`} className="mr-3 inline-block py-1 text-ink underline-offset-[3px] hover:underline">
              {t.label}
            </Link>
          ))}
        </p>
      </div>
      <DataStructureScene />
    </section>
  )
}

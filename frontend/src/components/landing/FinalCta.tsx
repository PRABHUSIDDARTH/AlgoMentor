import { ProblemStartForm } from '@/components/ProblemStartForm'

export function FinalCta() {
  return (
    <section className="border-t border-line">
      <div className="flex flex-col gap-6 px-6 sm:px-10 lg:px-16 xl:px-24 py-16 md:flex-row md:items-center md:justify-between">
        <h2 className="display max-w-[460px] text-[30px] leading-tight">Your next problem is one number away.</h2>
        <ProblemStartForm />
      </div>
    </section>
  )
}

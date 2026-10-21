import { ProblemStartForm } from '@/components/ProblemStartForm'

export function FinalCta() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between">
        <h2 className="display max-w-[460px] text-[30px] leading-tight">Your next problem is one number away.</h2>
        <ProblemStartForm />
      </div>
    </section>
  )
}

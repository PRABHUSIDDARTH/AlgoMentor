import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="bg-band text-on-band/75">
      <div className="flex flex-wrap items-center gap-5 px-6 sm:px-10 lg:px-16 xl:px-24 py-6 text-[12.5px]">
        <Logo className="text-[16px]" onBand />
        <a href="https://github.com/PRABHUSIDDARTH/AlgoMentor" className="hover:text-on-band">GitHub</a>
        <a href="https://github.com/PRABHUSIDDARTH/AlgoMentor#privacy" className="hover:text-on-band">Privacy</a>
        <span className="flex-1" />
        <span>Built by psTech</span>
      </div>
    </footer>
  )
}

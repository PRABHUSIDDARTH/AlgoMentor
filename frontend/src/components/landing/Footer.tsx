export function Footer() {
  return (
    <footer className="bg-band text-on-band/75">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-5 px-5 py-6 text-[12.5px] sm:px-8">
        <span className="font-display text-[15px] font-semibold text-on-band">AlgoMentor</span>
        <a href="https://github.com/PRABHUSIDDARTH/AlgoMentor" className="hover:text-on-band">GitHub</a>
        <a href="https://github.com/PRABHUSIDDARTH/AlgoMentor#privacy" className="hover:text-on-band">Privacy</a>
        <span className="flex-1" />
        <span>Built by psTech</span>
      </div>
    </footer>
  )
}

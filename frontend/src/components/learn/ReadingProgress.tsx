import { useEffect, useRef } from 'react'

/** A thin line at the top of the lesson that fills as you read. The page scrolls inside #main on desktop and on the window on phones. */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const main = document.getElementById('main')
    const update = () => {
      const scroller = main && main.scrollHeight > main.clientHeight + 1 ? main : null
      const top = scroller ? scroller.scrollTop : window.scrollY
      const max = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`
    }
    update()
    main?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      main?.removeEventListener('scroll', update)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return (
    <div aria-hidden="true" className="sticky top-0 z-20 h-[2px] bg-transparent">
      <div ref={bar} className="h-full origin-left bg-sage" style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}

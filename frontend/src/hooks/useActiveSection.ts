import { useEffect, useState } from 'react'

/** Index of the last section whose top has scrolled past `offset` px, or the last section at the page bottom. */
export function useActiveSection(ids: string[], offset = 140): number {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const update = () => {
      let index = 0
      ids.forEach((id, i) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 0) index = i
      })
      // A short last section can't scroll up to the offset; at the bottom of the page it is the one being read.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom && document.getElementById(ids[ids.length - 1])) index = ids.length - 1
      setActive(index)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ids, offset])
  return active
}

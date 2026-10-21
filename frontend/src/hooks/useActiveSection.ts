import { useEffect, useState } from 'react'

/** Index of the last section whose top has scrolled past `offset` px (a simple scroll-spy). */
export function useActiveSection(ids: string[], offset = 140): number {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const update = () => {
      let index = 0
      ids.forEach((id, i) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 0) index = i
      })
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
